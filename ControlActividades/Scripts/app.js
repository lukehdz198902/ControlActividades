var App = {
    currentProjectId: null,
    selectedIcon: '\uD83D\uDCBB',
    _toastTimer: null,
    currentUserRole: 'user',
    _charts: {},
    icons: ['\uD83D\uDCBB', '\uD83D\uDE80', '\uD83D\uDCCB', '\uD83D\uDCDD', '\uD83C\uDFA8', '\uD83D\uDD27', '\uD83D\uDCCA', '\uD83E\uDD1D', '\uD83D\uDCDA', '\uD83C\uDFAF', '\uD83D\uDCA1', '\u2B50', '\uD83D\uDD25', '\uD83D\uDCAA', '\uD83C\uDFC6', '\uD83C\uDF89', '\uD83D\uDCDE', '\u2709\uFE0F', '\uD83D\uDCC2', '\u2699\uFE0F', '\uD83D\uDCC8', '\uD83C\uDF93', '\uD83C\uDFD7\uFE0F', '\uD83C\uDFAC'],

    init: function () {
        $('#logoutBtn').on('click', function () { App.handleLogout(); });
        $('.nav-item').on('click', function (e) { e.preventDefault(); App.switchSection($(this).data('section')); });
        $('#projectForm').on('submit', function (e) { e.preventDefault(); App.handleNewProject(); });
        $('#activityForm').on('submit', function (e) { e.preventDefault(); App.handleNewActivity(); });
        $('#filterBtn').on('click', function () { App.renderDashboard(); });
        $('#backToDashboard').on('click', function () {
            App.currentProjectId = null;
            App.switchSection('dashboard');
        });
        $('#backToAdminDashboard').on('click', function () {
            App.switchSection('admin-dashboard');
        });
        $('#exportCsvBtn').on('click', function () { App.exportCsv(); });
        $('#adminUserForm').on('submit', function (e) { e.preventDefault(); App.handleCreateUser(); });
        $('#adminFilterBtn').on('click', function () { App.renderAdminDashboard(); });

        App.initIconPicker();
        App.initFilters();
        App.initPasswordModal();
        App.initEditUserModal();

        $.getJSON('/Account/CurrentUser', function (data) {
            if (data.loggedIn) {
                App.showApp(data.user.username, data.user.role);
            }
        });
    },

    showLogin: function () { window.location.href = '/Home/Index'; },

    showApp: function (username, role) {
        App.currentUserRole = role || 'user';
        $('#loginView').hide();
        $('#appView').css('display', 'flex');
        $('#currentUserDisplay').text(username);
        if (App.currentUserRole === 'admin') {
            $('#adminDivider, #adminNavSection').show();
        }
        App.refreshSidebar();
        App.switchSection('dashboard');
    },

    handleLogout: function () {
        $.post('/Account/Logout', function () { App.showLogin(); });
    },

    switchSection: function (section) {
        $('.nav-item').removeClass('active');
        var navItem = $('.nav-item[data-section="' + section + '"]');
        if (navItem.length) navItem.addClass('active');
        $('.content-section').removeClass('active');
        switch (section) {
            case 'dashboard':
                $('#dashboardSection').addClass('active');
                App.renderDashboard();
                break;
            case 'new-project':
                $('#newProjectSection').addClass('active');
                $('#projectName, #projectError').val('');
                break;
            case 'project-detail':
                $('#projectDetailSection').addClass('active');
                App.renderProjectDetail();
                break;
            case 'admin-users':
                $('#adminUsersSection').addClass('active');
                App.renderAdminUsersList();
                break;
            case 'admin-dashboard':
                $('#adminDashboardSection').addClass('active');
                App.initAdminFilters();
                App.renderAdminDashboard();
                break;
            case 'admin-user-activities':
                $('#adminUserActivitiesSection').addClass('active');
                App.renderAdminUserActivities();
                break;
        }
    },

    destroyChart: function (id) {
        if (App._charts[id]) { App._charts[id].destroy(); delete App._charts[id]; }
    },

    renderDashboard: function () {
        var month = parseInt($('#filterMonth').val());
        var year = parseInt($('#filterYear').val());
        var container = $('#dashboardContent');

        $.getJSON('/api/dashboard/summary?month=' + month + '&year=' + year, function (summary) {
            if (summary.length === 0) {
                container.html('<div class="empty-state"><div class="empty-icon">\uD83D\uDCC2</div><h3>No hay proyectos registrados</h3><p>Crea tu primer proyecto para comenzar.</p><button class="btn btn-primary" onclick="App.switchSection(\'new-project\')">Crear Proyecto</button></div>');
                App.destroyChart('dashboardChart');
                return;
            }
            var html = '<div class="dashboard-grid">';
            $.each(summary, function (i, p) {
                html += '<div class="project-card"><div class="project-card-header"><h3 class="project-card-name">' + escapeHtml(p.Name) + '</h3><span class="project-card-count">' + p.ActivityCount + ' act.</span></div><div class="project-card-stats"><div class="stat"><span class="stat-value">' + p.MonthHours.toFixed(1) + '</span><span class="stat-label">este mes</span></div><div class="stat"><span class="stat-value">' + p.TotalHours.toFixed(1) + '</span><span class="stat-label">total</span></div></div><button class="btn btn-outline btn-full btn-sm" onclick="App.selectProject(' + p.Id + ')">Ver</button></div>';
            });
            html += '</div>';
            container.html(html);

            var labels = summary.map(function(p) { return p.Name; });
            var values = summary.map(function(p) { return p.MonthHours; });
            var colors = ['#6C63FF','#00B894','#FDCB6E','#E17055','#74B9FF','#A29BFE','#FD79A8','#00CEC9','#636E72','#F8A5C2'];
            App.destroyChart('dashboardChart');
            var ctx = document.getElementById('dashboardChart').getContext('2d');
            App._charts.dashboardChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Horas este mes',
                        data: values,
                        backgroundColor: colors.slice(0, labels.length),
                        borderRadius: 4,
                        barThickness: 28
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
                        x: { ticks: { font: { size: 10 } }, grid: { display: false } }
                    }
                }
            });
        }).fail(function (jqXHR) {
            if (jqXHR.status === 401) { App.handleLogout(); return; }
            container.html('<div class="empty-state"><p>' + (jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error de conexión') + '</p></div>');
        });
    },

    selectProject: function (projectId) {
        App.currentProjectId = projectId;
        App.switchSection('project-detail');
    },

    renderProjectDetail: function () {
        $.getJSON('/api/projects/' + App.currentProjectId, function (project) {
            if (!project) {
                App.currentProjectId = null;
                App.switchSection('dashboard');
                App.showToast('Proyecto no encontrado', 'error');
                return;
            }
            $('#projectDetailTitle').text(project.Name);
            $('#activityDate').val(new Date().toISOString().split('T')[0]);
            $('#activityDesc, #activityError').val('');
            $('#activityHours').val(0);
            $('#activityMinutes').val('30');
            App.selectedIcon = '\uD83D\uDCBB';
            App.updateIconPicker();
            $('#activityImportance').val('Media');
            App.renderActivityList();
        }).fail(function () { App.showToast('Error al cargar el proyecto', 'error'); });
    },

    renderActivityList: function () {
        var container = $('#activityListContent');
        $.getJSON('/api/activities/project/' + App.currentProjectId, function (activities) {
            if (activities.length === 0) {
                container.html('<div class="empty-state small"><div class="empty-icon">\uD83D\uDCDD</div><p>No hay actividades registradas.</p></div>');
                return;
            }
            var badge = { Alta: '<span class="badge badge-danger">\uD83D\uDD34 Alta</span>', Media: '<span class="badge badge-warning">\uD83D\uDFE1 Media</span>', Baja: '<span class="badge badge-success">\uD83D\uDFE2 Baja</span>' };
            var html = '<div class="table-wrapper"><table class="table"><thead><tr><th>Fecha</th><th>Descripción</th><th>Tiempo</th><th>Icono</th><th>Importancia</th><th>Usuario</th></tr></thead><tbody>';
            $.each(activities, function (i, a) {
                var d = new Date(a.Date);
                var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                html += '<tr><td>' + dateStr + '</td><td>' + escapeHtml(a.Description) + '</td><td>' + a.Hours + 'h ' + a.Minutes + 'm</td><td style="font-size:1.2rem">' + a.Icon + '</td><td>' + (badge[a.Importance] || '') + '</td><td><span class="user-badge">' + escapeHtml(a.Username) + '</span></td></tr>';
            });
            html += '</tbody></table></div>';
            container.html(html);
        }).fail(function (jqXHR) {
            if (jqXHR.status === 401) { App.handleLogout(); return; }
            container.html('<div class="empty-state small"><p>' + (jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error de conexión') + '</p></div>');
        });
    },

    handleNewProject: function () {
        var name = $('#projectName').val().trim();
        var errorEl = $('#projectError');
        if (!name) { errorEl.text('Nombre requerido'); return; }
        $.ajax({
            type: 'POST', url: '/api/projects', contentType: 'application/json',
            data: JSON.stringify({ Name: name }),
            success: function () {
                $('#projectName').val(''); errorEl.text('');
                App.refreshSidebar();
                App.showToast('Proyecto creado', 'success');
                App.switchSection('dashboard');
            },
            error: function (jqXHR) {
                if (jqXHR.status === 401) { App.handleLogout(); return; }
                errorEl.text(jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error');
            }
        });
    },

    handleNewActivity: function () {
        if (!App.currentProjectId) return;
        var date = $('#activityDate').val();
        var description = $('#activityDesc').val().trim();
        var hours = parseInt($('#activityHours').val()) || 0;
        var minutes = parseInt($('#activityMinutes').val()) || 0;
        var icon = App.selectedIcon;
        var importance = $('#activityImportance').val();
        var errorEl = $('#activityError');
        if (!date) { errorEl.text('Fecha requerida'); return; }
        if (!description) { errorEl.text('Descripción requerida'); return; }
        if (hours === 0 && minutes === 0) { errorEl.text('Tiempo mayor a 0'); return; }
        $.ajax({
            type: 'POST', url: '/api/activities', contentType: 'application/json',
            data: JSON.stringify({ ProjectId: App.currentProjectId, Date: date, Description: description, Hours: hours, Minutes: minutes, Icon: icon, Importance: importance }),
            success: function () {
                $('#activityDesc').val(''); $('#activityHours').val(0); $('#activityMinutes').val('30');
                errorEl.text('');
                App.showToast('Actividad registrada', 'success');
                App.renderActivityList();
            },
            error: function (jqXHR) {
                if (jqXHR.status === 401) { App.handleLogout(); return; }
                errorEl.text(jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error');
            }
        });
    },

    initIconPicker: function () {
        var container = $('#iconPicker');
        container.empty();
        $.each(App.icons, function (i, icon) {
            container.append('<button type="button" class="icon-btn ' + (icon === App.selectedIcon ? 'active' : '') + '" data-icon="' + icon + '">' + icon + '</button>');
        });
        container.on('click', '.icon-btn', function () {
            App.selectedIcon = $(this).data('icon');
            App.updateIconPicker();
        });
    },

    updateIconPicker: function () {
        $('.icon-btn').each(function () {
            $(this).toggleClass('active', $(this).data('icon') === App.selectedIcon);
        });
    },

    initFilters: function () {
        var monthSelect = $('#filterMonth');
        var yearSelect = $('#filterYear');
        var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        monthSelect.empty();
        $.each(months, function (i, m) { monthSelect.append('<option value="' + (i+1) + '">' + m + '</option>'); });
        monthSelect.val(new Date().getMonth() + 1);
        yearSelect.empty();
        var cy = new Date().getFullYear();
        for (var y = cy - 5; y <= cy + 2; y++) { yearSelect.append('<option value="' + y + '"' + (y === cy ? ' selected' : '') + '>' + y + '</option>'); }
        var rm = $('#reportMonth'), ry = $('#reportYear');
        if (rm.length) { rm.empty(); $.each(months, function(i,m) { rm.append('<option value="'+(i+1)+'">'+m+'</option>'); }); rm.val(new Date().getMonth()+1); }
        if (ry.length) { ry.empty(); for(var y=cy-5;y<=cy+2;y++){ ry.append('<option value="'+y+'"'+(y===cy?' selected':'')+'>'+y+'</option>'); } }
    },

    refreshSidebar: function () {
        var container = $('#sidebarProjects');
        $.getJSON('/api/projects', function (projects) {
            if (projects.length === 0) { container.html('<p style="font-size:11px;color:var(--text-muted);padding:6px 10px">Sin proyectos</p>'); return; }
            container.empty();
            $.each(projects, function (i, p) { container.append('<a href="#" class="sidebar-project-item" data-id="' + p.Id + '"><span class="project-dot"></span><span class="project-name">' + escapeHtml(p.Name) + '</span></a>'); });
            container.find('.sidebar-project-item').on('click', function (e) { e.preventDefault(); App.selectProject($(this).data('id')); });
        }).fail(function (jqXHR) {
            if (jqXHR.status === 401) { App.handleLogout(); return; }
            container.html('<p style="font-size:11px;color:var(--danger);padding:6px 10px">Error</p>');
        });
    },

    exportCsv: function () {
        if (!App.currentProjectId) return;
        $.getJSON('/api/projects/' + App.currentProjectId, function (project) {
            $.getJSON('/api/activities/project/' + App.currentProjectId, function (activities) {
                if (activities.length === 0) { App.showToast('Sin actividades para exportar', 'error'); return; }
                var csv = 'Fecha,Descripción,Horas,Minutos,Icono,Importancia,Usuario\n';
                $.each(activities, function (i, a) {
                    var d = new Date(a.Date);
                    var dateStr = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
                    csv += '"' + dateStr + '","' + escapeCsv(a.Description) + '","' + a.Hours + '","' + a.Minutes + '","' + a.Icon + '","' + a.Importance + '","' + escapeCsv(a.Username) + '"\n';
                });
                var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                var link = document.createElement('a'); link.href = URL.createObjectURL(blob);
                link.download = project.Name + '_actividades.csv';
                document.body.appendChild(link); link.click(); document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                App.showToast('CSV exportado', 'success');
            });
        }).fail(function () { App.showToast('Error al exportar CSV', 'error'); });
    },

    showToast: function (message, type) {
        type = type || 'info';
        var toast = $('#toast');
        toast.text(message).removeClass('success error info show').addClass(type + ' show');
        clearTimeout(App._toastTimer);
        App._toastTimer = setTimeout(function () { toast.removeClass('show'); }, 2500);
    },

    validatePassword: function (pwd) {
        if (!pwd) return 'La contraseña es requerida';
        if (pwd.length < 8) return 'Debe tener al menos 8 caracteres';
        if (!/[A-Z]/.test(pwd)) return 'Debe contener al menos una mayúscula';
        if (!/[0-9]/.test(pwd)) return 'Debe contener al menos un número';
        if (!/[*_#$]/.test(pwd)) return 'Debe contener un símbolo: * _ # $';
        return null;
    },

    renderAdminUsersList: function () {
        var container = $('#adminUsersList');
        $.getJSON('/api/admin/users', function (users) {
            if (users.length === 0) { container.html('<div class="empty-state small"><p>Sin usuarios</p></div>'); return; }
            var roleBadge = { admin: '<span class="badge badge-danger">Admin</span>', user: '<span class="badge badge-success">Usuario</span>' };
            var html = '<div class="table-wrapper"><table class="table"><thead><tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Creado</th><th>Acción</th></tr></thead><tbody>';
            $.each(users, function (i, u) {
                var d = new Date(u.CreatedAt);
                var dateStr = d.toLocaleDateString('es-MX');
                html += '<tr><td>' + u.Id + '</td><td><span class="user-badge">' + escapeHtml(u.Username) + '</span></td><td>' + (roleBadge[u.Role] || u.Role) + '</td><td>' + dateStr + '</td><td><button class="btn btn-ghost btn-sm btn-edit-user" data-id="' + u.Id + '" data-username="' + escapeHtml(u.Username) + '" data-role="' + u.Role + '">✏️ Editar</button> <button class="btn btn-ghost btn-sm btn-change-pwd" data-id="' + u.Id + '" data-username="' + escapeHtml(u.Username) + '">🔑 Contraseña</button></td></tr>';
            });
            html += '</tbody></table></div>';
            container.html(html);
            container.find('.btn-change-pwd').on('click', function () {
                App.promptChangePassword($(this).data('id'), $(this).data('username'));
            });
            container.find('.btn-edit-user').on('click', function () {
                App.promptEditUser($(this).data('id'), $(this).data('username'), $(this).data('role'));
            });
        }).fail(function (jqXHR) {
            if (jqXHR.status === 401) { App.showToast('No autorizado', 'error'); return; }
            var msg = 'Error al cargar usuarios';
            try { var r = JSON.parse(jqXHR.responseText); if (r.Message) msg = r.Message; if (r.ExceptionMessage) msg = r.ExceptionMessage; } catch(e) {}
            container.html('<div class="empty-state small"><p>' + msg + '</p></div>');
        });
    },

    promptChangePassword: function (userId, username) {
        $('#passwordModalUser').text('Cambiando contraseña para: ' + username);
        $('#pwdModalNewPassword, #pwdModalConfirmPassword').val('');
        $('#pwdModalError').text('');
        App._pwdModalUserId = userId;
        $('#passwordModal').show();
        $('#pwdModalNewPassword').focus();
    },

    initPasswordModal: function () {
        $('#passwordModalClose, #passwordModalCancel').on('click', function () { $('#passwordModal').hide(); });
        $(document).on('keydown', function (e) { if (e.key === 'Escape') $('#passwordModal').hide(); });
        $('#passwordModal').on('click', function (e) { if (e.target === this) $('#passwordModal').hide(); });
        $('#passwordModalSave').on('click', function () {
            var userId = App._pwdModalUserId;
            var newPwd = $('#pwdModalNewPassword').val();
            var confirmPwd = $('#pwdModalConfirmPassword').val();
            var errorEl = $('#pwdModalError');
            var pwdError = App.validatePassword(newPwd);
            if (pwdError) { errorEl.text(pwdError); return; }
            if (newPwd !== confirmPwd) { errorEl.text('Las contraseñas no coinciden'); return; }
            $.ajax({
                type: 'PUT', url: '/api/admin/users/' + userId + '/password',
                contentType: 'application/json', data: JSON.stringify({ password: newPwd }),
                success: function () { $('#passwordModal').hide(); App.showToast('Contraseña actualizada', 'success'); App.renderAdminUsersList(); },
                error: function (jqXHR) { errorEl.text(jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error'); }
            });
        });
    },

    promptEditUser: function (userId, username, role) {
        $('#editUsername').val(username);
        $('#editRole').val(role);
        $('#editUserError').text('');
        App._editUserId = userId;
        $('#editUserModal').show();
        $('#editUsername').focus();
    },

    initEditUserModal: function () {
        $('#editUserModalClose, #editUserModalCancel').on('click', function () { $('#editUserModal').hide(); });
        $(document).on('keydown', function (e) { if (e.key === 'Escape') $('#editUserModal').hide(); });
        $('#editUserModal').on('click', function (e) { if (e.target === this) $('#editUserModal').hide(); });
        $('#editUserModalSave').on('click', function () {
            var userId = App._editUserId;
            var username = $('#editUsername').val().trim();
            var role = $('#editRole').val();
            var errorEl = $('#editUserError');
            if (!username) { errorEl.text('El nombre de usuario es requerido'); return; }
            $.ajax({
                type: 'PUT', url: '/api/admin/users/' + userId,
                contentType: 'application/json', data: JSON.stringify({ username: username, role: role }),
                success: function () { $('#editUserModal').hide(); App.showToast('Usuario actualizado', 'success'); App.renderAdminUsersList(); },
                error: function (jqXHR) { errorEl.text(jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error'); }
            });
        });
    },

    handleCreateUser: function () {
        var username = $('#adminNewUsername').val().trim();
        var password = $('#adminNewPassword').val();
        var confirmPwd = $('#adminNewPasswordConfirm').val();
        var role = $('#adminNewRole').val();
        var errorEl = $('#adminUserError');
        if (!username) { errorEl.text('Nombre de usuario requerido'); return; }
        var pwdError = App.validatePassword(password);
        if (pwdError) { errorEl.text(pwdError); return; }
        if (password !== confirmPwd) { errorEl.text('Las contraseñas no coinciden'); return; }
        $.ajax({
            type: 'POST', url: '/api/admin/users', contentType: 'application/json',
            data: JSON.stringify({ username: username, password: password, role: role }),
            success: function () {
                $('#adminNewUsername, #adminNewPassword, #adminNewPasswordConfirm').val('');
                errorEl.text('');
                App.showToast('Usuario creado', 'success');
                App.renderAdminUsersList();
            },
            error: function (jqXHR) { errorEl.text(jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error'); }
        });
    },

    initAdminFilters: function () {
        var monthSelect = $('#adminFilterMonth');
        var yearSelect = $('#adminFilterYear');
        if (monthSelect.children().length > 0 && yearSelect.children().length > 0) return;
        var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        monthSelect.empty();
        $.each(months, function (i, m) { monthSelect.append('<option value="' + (i+1) + '">' + m + '</option>'); });
        monthSelect.val(new Date().getMonth() + 1);
        yearSelect.empty();
        var cy = new Date().getFullYear();
        for (var y = cy - 5; y <= cy + 2; y++) { yearSelect.append('<option value="' + y + '"' + (y === cy ? ' selected' : '') + '>' + y + '</option>'); }
    },

    renderAdminDashboard: function () {
        var month = parseInt($('#adminFilterMonth').val());
        var year = parseInt($('#adminFilterYear').val());
        var container = $('#adminDashboardContent');

        $.getJSON('/api/admin/dashboard?month=' + month + '&year=' + year, function (data) {
            if (data.length === 0) {
                container.html('<div class="empty-state"><div class="empty-icon">📋</div><h3>Sin datos para este período</h3></div>');
                App.destroyChart('adminDashboardChart');
                return;
            }
            var html = '';
            $.each(data, function (i, user) {
                html += '<div class="card"><div class="card-header"><h3 class="card-title"><span class="user-badge" style="cursor:pointer" onclick="App.viewUserActivities(' + user.userId + ',\'' + escapeHtml(user.username) + '\')">' + escapeHtml(user.username) + ' →</span></h3><span class="stat-value">' + user.totalHours.toFixed(1) + ' h</span></div><div class="table-wrapper"><table class="table"><thead><tr><th>Proyecto</th><th>Horas</th><th>Actividades</th></tr></thead><tbody>';
                $.each(user.projects, function (j, p) {
                    html += '<tr><td>' + escapeHtml(p.projectName) + '</td><td>' + p.totalHours.toFixed(1) + ' h</td><td>' + p.activityCount + '</td></tr>';
                });
                html += '</tbody></table></div></div>';
            });
            container.html(html);

            var labels = data.map(function(u) { return u.username; });
            var values = data.map(function(u) { return u.totalHours; });
            var colors = ['#6C63FF','#00B894','#FDCB6E','#E17055','#74B9FF','#A29BFE','#FD79A8','#00CEC9','#636E72','#F8A5C2','#55EFC4','#FFEAA7'];
            App.destroyChart('adminDashboardChart');
            var ctx = document.getElementById('adminDashboardChart').getContext('2d');
            App._charts.adminDashboardChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Horas',
                        data: values,
                        backgroundColor: colors.slice(0, labels.length),
                        borderRadius: 4,
                        barThickness: 28
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
                        x: { ticks: { font: { size: 10 } }, grid: { display: false } }
                    }
                }
            });
        }).fail(function (jqXHR) {
            if (jqXHR.status === 401) { App.showToast('No autorizado', 'error'); return; }
            var msg = 'Error al cargar datos';
            try { var r = JSON.parse(jqXHR.responseText); if (r.Message) msg = r.Message; if (r.ExceptionMessage) msg = r.ExceptionMessage; } catch(e) {}
            container.html('<div class="empty-state"><p>' + msg + '</p></div>');
        });
    },

    viewUserActivities: function (userId, username) {
        App._viewUserId = userId;
        App._viewUsername = username;
        App._viewUserMonth = parseInt($('#adminFilterMonth').val());
        App._viewUserYear = parseInt($('#adminFilterYear').val());
        App.switchSection('admin-user-activities');
    },

    renderAdminUserActivities: function () {
        var userId = App._viewUserId;
        var username = App._viewUsername;
        var month = App._viewUserMonth;
        var year = App._viewUserYear;
        var container = $('#adminUserActivitiesContent');
        $('#adminUserActivitiesTitle').text('Actividades de ' + username);

        $.getJSON('/api/admin/users/' + userId + '/activities?month=' + month + '&year=' + year, function (activities) {
            if (activities.length === 0) {
                container.html('<div class="empty-state small"><p>Sin actividades en este período.</p></div>');
                return;
            }
            var badge = { Alta: '<span class="badge badge-danger">\uD83D\uDD34 Alta</span>', Media: '<span class="badge badge-warning">\uD83D\uDFE1 Media</span>', Baja: '<span class="badge badge-success">\uD83D\uDFE2 Baja</span>' };
            var html = '<div class="card"><div class="table-wrapper"><table class="table"><thead><tr><th>Fecha</th><th>Proyecto</th><th>Descripción</th><th>Tiempo</th><th>Importancia</th></tr></thead><tbody>';
            $.each(activities, function (i, a) {
                var d = new Date(a.Date);
                var dateStr = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
                html += '<tr><td>' + dateStr + '</td><td><span class="user-badge">' + escapeHtml(a.ProjectName) + '</span></td><td>' + escapeHtml(a.Description) + '</td><td>' + a.Hours + 'h ' + a.Minutes + 'm</td><td>' + (badge[a.Importance] || '') + '</td></tr>';
            });
            html += '</tbody></table></div></div>';
            container.html(html);
        }).fail(function (jqXHR) {
            if (jqXHR.status === 401) { App.showToast('No autorizado', 'error'); return; }
            var msg = 'Error';
            try { var r = JSON.parse(jqXHR.responseText); if (r.Message) msg = r.Message; if (r.ExceptionMessage) msg = r.ExceptionMessage; } catch(e) {}
            container.html('<div class="empty-state small"><p>' + msg + '</p></div>');
        });
    }
};

function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function escapeCsv(text) { return String(text).replace(/"/g, '""'); }

$(document).ready(function () { App.init(); });

(function() {
  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];
  var mouse = { x: null, y: null };
  var colors = ['rgba(108,99,255,', 'rgba(139,133,255,', 'rgba(165,160,255,', 'rgba(0,184,148,', 'rgba(116,185,255,'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  var pCount = Math.min(80, Math.floor(canvas.width * canvas.height / 12000));

  for (var i = 0; i < pCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2.5 + 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  canvas.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  canvas.addEventListener('mouseleave', function() {
    mouse.x = null;
    mouse.y = null;
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      var alpha = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();

      if (mouse.x !== null && mouse.y !== null) {
        var dx = mouse.x - p.x;
        var dy = mouse.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = 'rgba(108,99,255,' + (1 - dist / 150) * 0.15 + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
})();
