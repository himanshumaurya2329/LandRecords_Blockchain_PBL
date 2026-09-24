// Authentication utility functions
export const auth = {
    // Get stored auth data
    getToken() {
        return localStorage.getItem('token');
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getUsername() {
        const user = this.getUser();
        return user?.username || null;
    },

    getOrg() {
        const user = this.getUser();
        return user?.org || null;
    },

    getRole() {
        const user = this.getUser();
        return user?.role || null;
    },

    // Set auth data
    setAuthData(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Clear auth data
    clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken() && !!this.getUser();
    },

    // Check if user has specific role
    hasRole(role) {
        return this.getRole() === role;
    },

    // Check if user belongs to specific org
    isInOrg(org) {
        return this.getOrg() === org;
    },

    // Role-based access checks
    canCreateApplications() {
        return this.isInOrg('org1') && (this.hasRole('admin') || this.getUsername() === 'user_portal');
    },

    canVerifyApplications() {
        return this.isInOrg('org2') && this.hasRole('user');
    },

    canUpdateSurveyReports() {
        return this.isInOrg('org2') && this.getUsername() === 'survey1';
    },

    canApproveApplications() {
        return this.isInOrg('org3') && this.hasRole('user');
    },

    // Get dashboard route based on user
    getDashboardRoute() {
        const username = this.getUsername();
        const org = this.getOrg();

        if (org === 'org1') {
            if (username === 'user_portal') return '/dashboard/user';
            if (username === 'clerk1') return '/dashboard/clerk';
            if (username === 'superintendent1') return '/dashboard/superintendent';
            if (username === 'project_officer1') return '/dashboard/project-officer';
        }

        if (org === 'org2') {
            if (username === 'mro1') return '/dashboard/mro';
            if (username === 'vro1') return '/dashboard/vro';
            if (username === 'survey1') return '/dashboard/survey';
            if (username === 'revenue_officer1') return '/dashboard/revenue-officer';
            if (username === 'revenue_dept1') return '/dashboard/revenue-dept';
        }

        if (org === 'org3') {
            if (username === 'joint_collector1') return '/dashboard/joint-collector';
            if (username === 'collector1') return '/dashboard/collector';
            if (username === 'mw1') return '/dashboard/mw';
        }

        return '/dashboard';
    }
};