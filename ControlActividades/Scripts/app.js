var App = {
    currentProjectId: null,
    selectedIcon: '\uD83D\uDCBB',
    _toastTimer: null,
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
        $('#exportCsvBtn').on('click', function () { App.exportCsv(); });

        App.initIconPicker();
        App.initFilters();

        $.getJSON('/Account/CurrentUser', function (data) {
            if (data.loggedIn) {
                App.showApp(data.user.username);
            }
        });
    },

    showLogin: function () {
        window.location.href = '/Home/Index';
    },

    showApp: function (username) {
        $('#loginView').hide();
        $('#appView').css('display', 'flex');
        $('#currentUserDisplay').text(username);
        App.refreshSidebar();
        App.switchSection('dashboard');
    },

    handleLogout: function () {
        $.post('/Account/Logout', function () {
            App.showLogin();
        });
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
        }
    },

    renderDashboard: function () {
        var month = parseInt($('#filterMonth').val());
        var year = parseInt($('#filterYear').val());
        var container = $('#dashboardContent');

        $.getJSON('/api/dashboard/summary?month=' + month + '&year=' + year, function (summary) {
            if (summary.length === 0) {
                container.html('<div class="empty-state"><div class="empty-icon">\uD83D\uDCC2</div><h3>No hay proyectos registrados</h3><p>Crea tu primer proyecto para comenzar a registrar actividades.</p><button class="btn btn-primary" onclick="App.switchSection(\'new-project\')">Crear Proyecto</button></div>');
                return;
            }
            var html = '<div class="dashboard-grid">';
            $.each(summary, function (i, p) {
                html += '<div class="project-card"><div class="project-card-header"><h3 class="project-card-name">' + escapeHtml(p.Name) + '</h3><span class="project-card-count">' + p.ActivityCount + ' actividades</span></div><div class="project-card-stats"><div class="stat"><span class="stat-value">' + p.MonthHours.toFixed(1) + '</span><span class="stat-label">horas este mes</span></div><div class="stat"><span class="stat-value">' + p.TotalHours.toFixed(1) + '</span><span class="stat-label">horas totales</span></div></div><button class="btn btn-outline btn-full" onclick="App.selectProject(' + p.Id + ')">Ver Actividades</button></div>';
            });
            html += '</div>';
            container.html(html);
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
        }).fail(function () {
            App.showToast('Error al cargar el proyecto', 'error');
        });
    },

    renderActivityList: function () {
        var container = $('#activityListContent');
        $.getJSON('/api/activities/project/' + App.currentProjectId, function (activities) {
            if (activities.length === 0) {
                container.html('<div class="empty-state small"><div class="empty-icon">\uD83D\uDCDD</div><p>No hay actividades registradas para este proyecto.</p><p style="font-size:13px;color:var(--text-muted)">Usa el formulario de arriba para registrar tu primera actividad.</p></div>');
                return;
            }
            var badge = {
                Alta: '<span class="badge badge-danger">\uD83D\uDD34 Alta</span>',
                Media: '<span class="badge badge-warning">\uD83D\uDFE1 Media</span>',
                Baja: '<span class="badge badge-success">\uD83D\uDFE2 Baja</span>'
            };
            var html = '<div class="table-wrapper"><table class="table"><thead><tr><th>Fecha</th><th>Descripción</th><th>Tiempo</th><th>Icono</th><th>Importancia</th><th>Usuario</th></tr></thead><tbody>';
            $.each(activities, function (i, a) {
                var d = new Date(a.Date);
                var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                html += '<tr><td>' + dateStr + '</td><td>' + escapeHtml(a.Description) + '</td><td>' + a.Hours + 'h ' + a.Minutes + 'm</td><td style="font-size:1.4rem">' + a.Icon + '</td><td>' + (badge[a.Importance] || '') + '</td><td><span class="user-badge">' + escapeHtml(a.Username) + '</span></td></tr>';
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
        if (!name) { errorEl.text('El nombre del proyecto es requerido'); return; }
        $.ajax({
            type: 'POST',
            url: '/api/projects',
            contentType: 'application/json',
            data: JSON.stringify({ Name: name }),
            success: function () {
                $('#projectName').val('');
                errorEl.text('');
                App.refreshSidebar();
                App.showToast('Proyecto creado exitosamente', 'success');
                App.switchSection('dashboard');
            },
            error: function (jqXHR) {
                if (jqXHR.status === 401) { App.handleLogout(); return; }
                errorEl.text(jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error al crear proyecto');
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

        if (!date) { errorEl.text('La fecha es requerida'); return; }
        if (!description) { errorEl.text('La descripción es requerida'); return; }
        if (hours === 0 && minutes === 0) { errorEl.text('El tiempo debe ser mayor a 0'); return; }

        $.ajax({
            type: 'POST',
            url: '/api/activities',
            contentType: 'application/json',
            data: JSON.stringify({
                ProjectId: App.currentProjectId,
                Date: date,
                Description: description,
                Hours: hours,
                Minutes: minutes,
                Icon: icon,
                Importance: importance
            }),
            success: function () {
                $('#activityDesc').val('');
                $('#activityHours').val(0);
                $('#activityMinutes').val('30');
                errorEl.text('');
                App.showToast('Actividad registrada exitosamente', 'success');
                App.renderActivityList();
            },
            error: function (jqXHR) {
                if (jqXHR.status === 401) { App.handleLogout(); return; }
                errorEl.text(jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error al registrar actividad');
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
        var months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        monthSelect.empty();
        $.each(months, function (i, m) {
            monthSelect.append('<option value="' + (i + 1) + '">' + m + '</option>');
        });
        monthSelect.val(new Date().getMonth() + 1);

        yearSelect.empty();
        var cy = new Date().getFullYear();
        for (var y = cy - 5; y <= cy + 2; y++) {
            yearSelect.append('<option value="' + y + '"' + (y === cy ? ' selected' : '') + '>' + y + '</option>');
        }

        var reportMonth = $('#reportMonth');
        var reportYear = $('#reportYear');
        if (reportMonth.length) {
            reportMonth.empty();
            $.each(months, function (i, m) {
                reportMonth.append('<option value="' + (i + 1) + '">' + m + '</option>');
            });
            reportMonth.val(new Date().getMonth() + 1);
        }
        if (reportYear.length) {
            reportYear.empty();
            for (var y = cy - 5; y <= cy + 2; y++) {
                reportYear.append('<option value="' + y + '"' + (y === cy ? ' selected' : '') + '>' + y + '</option>');
            }
        }
    },

    refreshSidebar: function () {
        var container = $('#sidebarProjects');
        $.getJSON('/api/projects', function (projects) {
            if (projects.length === 0) {
                container.html('<p style="font-size:12px;color:var(--text-muted);padding:8px 12px">No hay proyectos aún</p>');
                return;
            }
            container.empty();
            $.each(projects, function (i, p) {
                container.append('<a href="#" class="sidebar-project-item" data-id="' + p.Id + '"><span class="project-dot"></span><span class="project-name">' + escapeHtml(p.Name) + '</span></a>');
            });
            container.find('.sidebar-project-item').on('click', function (e) {
                e.preventDefault();
                App.selectProject($(this).data('id'));
            });
        }).fail(function (jqXHR) {
            if (jqXHR.status === 401) { App.handleLogout(); return; }
            container.html('<p style="font-size:12px;color:var(--danger);padding:8px 12px">' + (jqXHR.responseJSON ? jqXHR.responseJSON.error : 'Error de conexión') + '</p>');
        });
    },

    exportCsv: function () {
        if (!App.currentProjectId) return;
        $.getJSON('/api/projects/' + App.currentProjectId, function (project) {
            $.getJSON('/api/activities/project/' + App.currentProjectId, function (activities) {
                if (activities.length === 0) {
                    App.showToast('No hay actividades para exportar', 'error');
                    return;
                }
                var csv = 'Fecha,Descripción,Horas,Minutos,Icono,Importancia,Usuario\n';
                $.each(activities, function (i, a) {
                    var d = new Date(a.Date);
                    var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    csv += '"' + dateStr + '","' + escapeCsv(a.Description) + '","' + a.Hours + '","' + a.Minutes + '","' + a.Icon + '","' + a.Importance + '","' + escapeCsv(a.Username) + '"\n';
                });
                var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                var link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = project.Name + '_actividades.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                App.showToast('CSV exportado exitosamente', 'success');
            });
        }).fail(function () {
            App.showToast('Error al exportar CSV', 'error');
        });
    },

    showToast: function (message, type) {
        type = type || 'info';
        var toast = $('#toast');
        toast.text(message).removeClass('success error info show').addClass(type + ' show');
        clearTimeout(App._toastTimer);
        App._toastTimer = setTimeout(function () { toast.removeClass('show'); }, 3000);
    }
};

function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function escapeCsv(text) {
    return String(text).replace(/"/g, '""');
}

$(document).ready(function () { App.init(); });
