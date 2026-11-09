/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { SuperAdminDashboard } from './components/dashboard/superadmin/SuperAdminDashboard';
import { CompanyAdminDashboard } from './components/dashboard/companyadmin/CompanyAdminDashboard';
import { UserProfilePage } from './components/user/UserProfilePage';
import { SettingsPage } from './components/settings/SettingsPage';
import { CompanyProfilePage } from './components/company/CompanyProfilePage';
import { DevDocumentationModal } from './components/documentation/DevDocumentationModal';
import { LegalModals } from './components/common/LegalModals';
import { Company, UserRole } from './types';

type AppView = 'landing' | 'login' | 'register' | 'forgot_password' | 'workspace' | 'user_profile';

function MainApp() {
  const { currentUser, role, setCurrentCompany, loginAsRole } = useAuth();

  // Route / View state
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeTab, setActiveTab] = useState<string>('sa_dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  // Quick switch into workspace when exploring demo from landing page
  const handleExploreDemo = (targetRole: 'super_admin' | 'company_admin' = 'company_admin') => {
    loginAsRole(targetRole);
    setActiveTab(targetRole === 'super_admin' ? 'sa_dashboard' : 'ca_dashboard');
    setCurrentView('workspace');
  };

  const handleSwitchToCompany = (comp: Company) => {
    setCurrentCompany(comp);
    loginAsRole('company_admin', comp.id);
    setActiveTab('ca_dashboard');
    setCurrentView('workspace');
  };

  // Login success
  const handleLoginSuccess = () => {
    setActiveTab(role === 'super_admin' ? 'sa_dashboard' : 'ca_dashboard');
    setCurrentView('workspace');
  };

  // Registration success
  const handleRegisterSuccess = () => {
    setActiveTab('ca_dashboard');
    setCurrentView('workspace');
  };

  // Public Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onGoToLogin={() => setCurrentView('login')}
          onGoToRegister={() => setCurrentView('register')}
          onExploreDemo={handleExploreDemo}
          onOpenDocs={() => setIsDocsOpen(true)}
          onOpenPrivacy={() => setLegalModal('privacy')}
          onOpenTerms={() => setLegalModal('terms')}
        />
        <DevDocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
        <LegalModals type={legalModal} onClose={() => setLegalModal(null)} />
      </>
    );
  }

  // Login Page
  if (currentView === 'login') {
    return (
      <>
        <LoginPage
          onSuccess={handleLoginSuccess}
          onGoToRegister={() => setCurrentView('register')}
          onGoToLanding={() => setCurrentView('landing')}
          onGoToForgotPassword={() => setCurrentView('forgot_password')}
        />
        <DevDocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
        <LegalModals type={legalModal} onClose={() => setLegalModal(null)} />
      </>
    );
  }

  // Registration Page
  if (currentView === 'register') {
    return (
      <>
        <RegisterPage
          onSuccess={handleRegisterSuccess}
          onGoToLogin={() => setCurrentView('login')}
          onGoToLanding={() => setCurrentView('landing')}
          onOpenTerms={() => setLegalModal('terms')}
          onOpenPrivacy={() => setLegalModal('privacy')}
        />
        <DevDocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
        <LegalModals type={legalModal} onClose={() => setLegalModal(null)} />
      </>
    );
  }

  // Forgot Password Page
  if (currentView === 'forgot_password') {
    return (
      <>
        <ForgotPasswordPage
          onBackToLogin={() => setCurrentView('login')}
          onGoToLanding={() => setCurrentView('landing')}
        />
        <DevDocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      </>
    );
  }

  // User Profile dedicated view
  if (currentView === 'user_profile') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <Navbar
          onToggleSidebar={() => {}}
          onOpenDocs={() => setIsDocsOpen(true)}
          onOpenRegister={() => setCurrentView('register')}
          onGoToLanding={() => setCurrentView('landing')}
          onGoToUserProfile={() => setCurrentView('user_profile')}
          onGoToSettings={() => {
            setActiveTab('ca_settings');
            setCurrentView('workspace');
          }}
        />
        <div className="p-6 max-w-4xl mx-auto w-full">
          <div className="mb-4">
            <button
              onClick={() => setCurrentView('workspace')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              ← Return to Dashboard
            </button>
          </div>
          <UserProfilePage />
        </div>
        <DevDocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      </div>
    );
  }

  // Authenticated Portal Workspace (Super Admin or Company Admin)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => {
          if (window.innerWidth < 1024) {
            setMobileSidebarOpen(!mobileSidebarOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenRegister={() => setCurrentView('register')}
        onGoToLanding={() => setCurrentView('landing')}
        onGoToUserProfile={() => setCurrentView('user_profile')}
        onGoToSettings={() => {
          setActiveTab(role === 'super_admin' ? 'sa_settings' : 'ca_settings');
        }}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex">
        {/* Navy Blue Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Content Area */}
        <main
          className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            {role === 'super_admin' ? (
              <SuperAdminDashboard
                activeTab={activeTab}
                onOpenRegister={() => setCurrentView('register')}
                onSwitchToCompany={handleSwitchToCompany}
                onOpenDocs={() => setIsDocsOpen(true)}
                onSelectTab={(tabId) => setActiveTab(tabId)}
              />
            ) : (
              <CompanyAdminDashboard
                activeTab={activeTab}
                onOpenDocs={() => setIsDocsOpen(true)}
                onOpenForgotPassword={() => setCurrentView('forgot_password')}
                onSelectTab={(tabId) => setActiveTab(tabId)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Developer Docs Modal & Legal Overlays */}
      <DevDocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      <LegalModals type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
