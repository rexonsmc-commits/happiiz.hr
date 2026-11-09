/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, testConnection } from '../services/firebase';
import { UserProfile, Company, UserRole } from '../types';
import {
  getCompanies,
  createCompany,
  updateCompanyProfile,
  logAuditEvent,
  syncUserProfile,
} from '../services/tenantService';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentCompany: Company | null;
  availableCompanies: Company[];
  role: UserRole;
  isLoading: boolean;
  isDbConnected: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Company>;
  sendResetEmail: (email: string) => Promise<void>;
  loginAsRole: (role: UserRole, companyId?: string) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentCompany: (company: Company) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateCurrentCompany: (updates: Partial<Company>) => Promise<void>;
  registerTenant: (data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Company>;
  refreshCompanies: () => Promise<void>;
  refreshSuperAdminToken: () => Promise<void>;
}

import { syncMasterSuperAdminRecord } from '../services/platformService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MASTER_SUPER_ADMIN_UID = 'myHfxnY2nnVBsbwrg3vgu6PhNSR2';
export const MASTER_SUPER_ADMIN_EMAIL = 'superadmin@happiizhr.com';
export const SUPER_ADMIN_EMAILS = [
  'superadmin@happiizhr.com',
  'rexon.smc@gmail.com',
];

export function isSuperAdminUser(uid?: string, email?: string, claims?: Record<string, any>): boolean {
  if (uid === MASTER_SUPER_ADMIN_UID) return true;
  if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  if (claims?.role === 'platform_owner' || claims?.superAdmin === true || claims?.role === 'super_admin') return true;
  return false;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);

  // Load companies & test DB on boot
  useEffect(() => {
    async function init() {
      try {
        const connected = await testConnection();
        setIsDbConnected(connected);

        const comps = await getCompanies();
        setAvailableCompanies(comps);

        // Default company context to first company
        if (comps.length > 0) {
          setCurrentCompanyState(comps[0]);
        }
      } catch (err) {
        console.error('Boot init failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        let claims: Record<string, any> = {};
        try {
          const tokenRes = await fbUser.getIdTokenResult();
          claims = tokenRes.claims || {};
        } catch (e) {
          // ignore
        }

        const isSuper = isSuperAdminUser(fbUser.uid, fbUser.email || undefined, claims);
        const isSandeep = fbUser.uid === MASTER_SUPER_ADMIN_UID || fbUser.email?.toLowerCase() === MASTER_SUPER_ADMIN_EMAIL.toLowerCase();

        const matchedComp = availableCompanies.find(
          (c) => c.adminEmail.toLowerCase() === fbUser.email?.toLowerCase()
        );

        let savedRole: UserRole = isSuper ? 'super_admin' : 'company_admin';
        let savedCompanyId = matchedComp?.id || currentCompany?.id || (availableCompanies[0] ? availableCompanies[0].id : '');
        let savedTenantId = matchedComp?.tenantId || currentCompany?.tenantId || (availableCompanies[0] ? availableCompanies[0].tenantId : 'general');
        let savedDisplayName = isSandeep
          ? 'Sandeep Rana (Master Platform Owner)'
          : (fbUser.displayName || matchedComp?.adminName || (isSuper ? 'Platform Owner / Super Admin' : 'Company Admin'));

        try {
          const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.role) savedRole = isSuper ? 'super_admin' : (data.role as UserRole);
            if (data.companyId) savedCompanyId = data.companyId;
            if (data.tenantId) savedTenantId = data.tenantId;
            if (data.displayName && !isSandeep) savedDisplayName = data.displayName;
          }
        } catch (readErr) {
          console.warn('[Happiiz HR] User profile fetch note:', readErr);
        }

        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || (isSandeep ? MASTER_SUPER_ADMIN_EMAIL : 'user@happiiz.io'),
          displayName: savedDisplayName,
          role: savedRole,
          adminSubRole: isSuper ? 'platform_owner' : undefined,
          avatarUrl: fbUser.photoURL || undefined,
          companyId: isSuper ? undefined : savedCompanyId,
          tenantId: isSuper ? 'system' : savedTenantId,
          associatedCompany: isSuper ? 'Happiiz Global Platform' : (matchedComp?.name || currentCompany?.name || 'Happiiz Platform'),
          phone: matchedComp?.phone,
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        if (matchedComp) {
          setCurrentCompanyState(matchedComp);
        } else if (savedCompanyId) {
          const comp = availableCompanies.find((c) => c.id === savedCompanyId);
          if (comp) setCurrentCompanyState(comp);
        }

        setCurrentUser(profile);

        // Always sync user profile to Firestore so exists(/users/$(request.auth.uid)) succeeds
        await syncUserProfile(profile);

        // If super admin, ensure platform_administrators record is synchronized
        if (isSuper) {
          await syncMasterSuperAdminRecord(fbUser.uid, profile.email, profile.displayName);
        }
      }
    });

    return () => unsubscribe();
  }, [availableCompanies]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isSuper = isSuperAdminUser(result.user.uid, result.user.email || undefined);

      const matchedComp = availableCompanies.find(
        (c) => c.adminEmail.toLowerCase() === result.user.email?.toLowerCase()
      );

      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || 'user@happiiz.io',
        displayName: result.user.displayName || matchedComp?.adminName || (isSuper ? 'Platform Owner' : 'Authorized Admin'),
        role: isSuper ? 'super_admin' : 'company_admin',
        avatarUrl: result.user.photoURL || undefined,
        companyId: matchedComp?.id || availableCompanies[0]?.id || '',
        tenantId: matchedComp?.tenantId || availableCompanies[0]?.tenantId || 'general',
        associatedCompany: matchedComp?.name || availableCompanies[0]?.name || 'Happiiz Enterprise',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      if (matchedComp) {
        setCurrentCompanyState(matchedComp);
      }

      setCurrentUser(profile);
      await syncUserProfile(profile);

      await logAuditEvent({
        tenantId: isSuper ? 'system' : currentCompany?.tenantId || 'general',
        actorUid: result.user.uid,
        actorEmail: result.user.email || 'unknown',
        action: 'USER_LOGIN_GOOGLE',
        category: 'auth',
        details: `Authenticated via Google SSO as ${profile.role}`,
      });
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      let fbUid = '';
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        fbUid = cred.user.uid;
      } catch (err: any) {
        console.warn('Firebase email auth note:', err?.code, err?.message);
        if (
          err?.code === 'auth/user-not-found' ||
          err?.code === 'auth/invalid-credential' ||
          err?.message?.includes('user-not-found')
        ) {
          // If the account does not exist yet in Firebase Auth, attempt bootstrap registration
          try {
            const newCred = await createUserWithEmailAndPassword(auth, email, pass);
            fbUid = newCred.user.uid;
            console.log('[Happiiz HR] Bootstrapped new Firebase Auth account for:', email);
          } catch (createErr: any) {
            console.warn('[Happiiz HR] Create auth user failed:', createErr?.code, createErr?.message);
            // If email already in use, password was incorrect
            if (createErr?.code === 'auth/email-already-in-use') {
              throw new Error('Incorrect password for this account. Please verify credentials or reset password.');
            }
            fbUid = auth.currentUser?.uid || `usr_${Date.now()}`;
          }
        } else {
          throw err;
        }
      }

      const isSandeep = email.toLowerCase() === MASTER_SUPER_ADMIN_EMAIL.toLowerCase() || fbUid === MASTER_SUPER_ADMIN_UID;
      const isSuper = isSandeep || isSuperAdminUser(fbUid, email);
      const matchedComp = availableCompanies.find(
        (c) => c.adminEmail.toLowerCase() === email.toLowerCase()
      ) || availableCompanies[0];

      const assignedUid = isSandeep && !fbUid.startsWith('usr_') ? fbUid : (isSandeep ? MASTER_SUPER_ADMIN_UID : fbUid);

      const profile: UserProfile = {
        uid: assignedUid,
        email,
        displayName: isSandeep
          ? 'Sandeep Rana (Master Platform Owner)'
          : (isSuper ? 'Platform Owner / Super Admin' : matchedComp?.adminName || 'Company Admin'),
        role: isSuper ? 'super_admin' : 'company_admin',
        adminSubRole: isSuper ? 'platform_owner' : undefined,
        companyId: isSuper ? undefined : matchedComp?.id,
        tenantId: isSuper ? 'system' : matchedComp?.tenantId,
        associatedCompany: isSuper ? 'Happiiz Global Platform' : matchedComp?.name,
        phone: matchedComp?.phone,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      if (matchedComp && !isSuper) {
        setCurrentCompanyState(matchedComp);
      }

      setCurrentUser(profile);
      await syncUserProfile(profile);

      if (isSuper) {
        await syncMasterSuperAdminRecord(assignedUid, email, profile.displayName);
      }

      await logAuditEvent({
        tenantId: profile.tenantId || 'general',
        actorUid: profile.uid,
        actorEmail: email,
        action: 'USER_LOGIN_PASSWORD',
        category: 'auth',
        details: `Session authorized as ${profile.role} for ${profile.associatedCompany || 'Platform'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Company> => {
    setIsLoading(true);
    try {
      let uid = '';
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        uid = cred.user.uid;
      } catch (err: any) {
        console.warn('Firebase createUser note:', err);
        uid = auth.currentUser?.uid || `usr_${Date.now()}`;
      }

      // Provision tenant record in Firestore
      const newComp = await createCompany(companyData);
      const updated = [newComp, ...availableCompanies];
      setAvailableCompanies(updated);
      setCurrentCompanyState(newComp);

      const profile: UserProfile = {
        uid,
        email,
        displayName: companyData.adminName,
        role: 'company_admin',
        companyId: newComp.id,
        tenantId: newComp.tenantId,
        associatedCompany: newComp.name,
        phone: companyData.phone,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(profile);
      await syncUserProfile(profile);
      return newComp;
    } finally {
      setIsLoading(false);
    }
  };

  const sendResetEmail = async (email: string) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.warn('Firebase reset note:', err?.message || err);
      // Don't leak whether an account exists per security guidelines
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsRole = async (targetRole: UserRole, targetCompanyId?: string) => {
    setIsLoading(true);
    try {
      let comp = currentCompany;
      if (targetCompanyId) {
        const found = availableCompanies.find((c) => c.id === targetCompanyId);
        if (found) comp = found;
      } else if (availableCompanies.length > 0 && !comp) {
        comp = availableCompanies[0];
      }

      if (comp) {
        setCurrentCompanyState(comp);
      }

      let email = 'admin@happiiz.io';
      let name = 'Demo Operator';

      if (targetRole === 'super_admin' || targetRole === 'platform_owner') {
        email = MASTER_SUPER_ADMIN_EMAIL;
        name = 'Sandeep Rana (Master Platform Owner)';
      } else if (targetRole === 'company_admin') {
        email = comp?.adminEmail || 'ops@apexsecurity.io';
        name = comp?.adminName || 'Company Administrator';
      } else if (targetRole === 'employee') {
        email = 'guard.surender@happiiz.io';
        name = 'Surender Pal Singh (Armed Guard)';
      } else if (targetRole === 'client') {
        email = 'facilities@infosys.example';
        name = 'Infosys Campus Client Representative';
      }

      const isSuper = targetRole === 'super_admin' || targetRole === 'platform_owner';
      const uid = isSuper
        ? (auth.currentUser?.uid || MASTER_SUPER_ADMIN_UID)
        : (auth.currentUser?.uid || `usr_${targetRole}_${Date.now()}`);

      const profile: UserProfile = {
        uid,
        email,
        displayName: name,
        role: isSuper ? 'super_admin' : targetRole,
        adminSubRole: isSuper ? 'platform_owner' : undefined,
        companyId: isSuper ? undefined : comp?.id,
        tenantId: isSuper ? 'system' : comp?.tenantId,
        associatedCompany: isSuper ? 'Happiiz Global Platform' : comp?.name,
        phone: comp?.phone,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(profile);
      await syncUserProfile(profile);

      if (isSuper) {
        await syncMasterSuperAdminRecord(uid, email, name);
      }

      await logAuditEvent({
        tenantId: comp?.tenantId || 'system',
        actorUid: profile.uid,
        actorEmail: email,
        action: `PORTAL_ACCESSED_${targetRole.toUpperCase()}`,
        category: 'auth',
        details: `Session initiated in ${targetRole} workspace for tenant ${comp?.name || 'Platform'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('SignOut note:', err);
    }
    setCurrentUser(null);
  };

  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company);
    if (currentUser && currentUser.role === 'company_admin') {
      setCurrentUser({
        ...currentUser,
        companyId: company.id,
        tenantId: company.tenantId,
        associatedCompany: company.name,
        displayName: company.adminName || currentUser.displayName,
        email: company.adminEmail || currentUser.email,
        phone: company.phone || currentUser.phone,
      });
    }
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateCurrentCompany = async (updates: Partial<Company>) => {
    if (!currentCompany) return;
    const updated = await updateCompanyProfile(currentCompany.id, updates, currentUser?.email);
    setCurrentCompanyState(updated);
    setAvailableCompanies((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const registerTenant = async (
    data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Company> => {
    const newComp = await createCompany(data);
    const updated = [newComp, ...availableCompanies];
    setAvailableCompanies(updated);
    setCurrentCompanyState(newComp);
    return newComp;
  };

  const refreshCompanies = async () => {
    const comps = await getCompanies();
    setAvailableCompanies(comps);
  };

  const refreshSuperAdminToken = async () => {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
      const res = await auth.currentUser.getIdTokenResult();
      console.log('[Happiiz HR] Super admin custom claims refreshed:', res.claims);
    }
  };

  const effectiveRole: UserRole = currentUser?.role || 'company_admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCompany,
        availableCompanies,
        role: effectiveRole,
        isLoading,
        isDbConnected,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        sendResetEmail,
        loginAsRole,
        logout,
        setCurrentCompany,
        updateUser,
        updateCurrentCompany,
        registerTenant,
        refreshCompanies,
        refreshSuperAdminToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
