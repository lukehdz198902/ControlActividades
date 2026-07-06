USE [ControlActividades];
GO

-- =============================================
-- usp_ValidateUser
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_ValidateUser')
    DROP PROCEDURE [dbo].[usp_ValidateUser];
GO
CREATE PROCEDURE [dbo].[usp_ValidateUser]
    @Username NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [Id], [Username], [PasswordHash], [Role], [CreatedAt]
    FROM [dbo].[Users]
    WHERE [Username] = @Username;
END
GO

-- =============================================
-- usp_GetProjectsByUser
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetProjectsByUser')
    DROP PROCEDURE [dbo].[usp_GetProjectsByUser];
GO
CREATE PROCEDURE [dbo].[usp_GetProjectsByUser]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [Id], [Name], [UserId], [CreatedAt]
    FROM [dbo].[Projects]
    WHERE [UserId] = @UserId
    ORDER BY [Name];
END
GO

-- =============================================
-- usp_GetProjectById
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetProjectById')
    DROP PROCEDURE [dbo].[usp_GetProjectById];
GO
CREATE PROCEDURE [dbo].[usp_GetProjectById]
    @ProjectId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [Id], [Name], [UserId], [CreatedAt]
    FROM [dbo].[Projects]
    WHERE [Id] = @ProjectId AND [UserId] = @UserId;
END
GO

-- =============================================
-- usp_CreateProject
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_CreateProject')
    DROP PROCEDURE [dbo].[usp_CreateProject];
GO
CREATE PROCEDURE [dbo].[usp_CreateProject]
    @Name NVARCHAR(255),
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM [dbo].[Projects] WHERE LOWER([Name]) = LOWER(@Name) AND [UserId] = @UserId)
    BEGIN
        SELECT CAST(0 AS BIT) AS [Success], CAST(NULL AS INT) AS [Id], CAST(NULL AS NVARCHAR(255)) AS [Name], CAST(NULL AS INT) AS [UserId], CAST(NULL AS DATETIME2) AS [CreatedAt];
        RETURN;
    END
    INSERT INTO [dbo].[Projects] ([Name], [UserId]) VALUES (@Name, @UserId);
    SELECT CAST(1 AS BIT) AS [Success], [Id], [Name], [UserId], [CreatedAt]
    FROM [dbo].[Projects]
    WHERE [Id] = SCOPE_IDENTITY();
END
GO

-- =============================================
-- usp_GetActivitiesByProject
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetActivitiesByProject')
    DROP PROCEDURE [dbo].[usp_GetActivitiesByProject];
GO
CREATE PROCEDURE [dbo].[usp_GetActivitiesByProject]
    @ProjectId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.[Id], a.[ProjectId], a.[UserId], a.[Date], a.[Description], a.[Hours], a.[Minutes], a.[Icon], a.[Importance], a.[CreatedAt], u.[Username]
    FROM [dbo].[Activities] a
    INNER JOIN [dbo].[Users] u ON a.[UserId] = u.[Id]
    WHERE a.[ProjectId] = @ProjectId AND a.[UserId] = @UserId
    ORDER BY a.[Date] DESC, a.[CreatedAt] DESC;
END
GO

-- =============================================
-- usp_CreateActivity
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_CreateActivity')
    DROP PROCEDURE [dbo].[usp_CreateActivity];
GO
CREATE PROCEDURE [dbo].[usp_CreateActivity]
    @ProjectId INT,
    @UserId INT,
    @Date DATE,
    @Description NVARCHAR(MAX),
    @Hours INT,
    @Minutes INT,
    @Icon NVARCHAR(10),
    @Importance NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO [dbo].[Activities] ([ProjectId], [UserId], [Date], [Description], [Hours], [Minutes], [Icon], [Importance])
    VALUES (@ProjectId, @UserId, @Date, @Description, @Hours, @Minutes, @Icon, @Importance);

    SELECT a.[Id], a.[ProjectId], a.[UserId], a.[Date], a.[Description], a.[Hours], a.[Minutes], a.[Icon], a.[Importance], a.[CreatedAt], u.[Username]
    FROM [dbo].[Activities] a
    INNER JOIN [dbo].[Users] u ON a.[UserId] = u.[Id]
    WHERE a.[Id] = SCOPE_IDENTITY();
END
GO

-- =============================================
-- usp_GetDashboardSummary
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetDashboardSummary')
    DROP PROCEDURE [dbo].[usp_GetDashboardSummary];
GO
CREATE PROCEDURE [dbo].[usp_GetDashboardSummary]
    @UserId INT,
    @Month INT,
    @Year INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.[Id],
        p.[Name],
        p.[UserId],
        p.[CreatedAt],
        ISNULL(SUM(CASE WHEN MONTH(a.[Date]) = @Month AND YEAR(a.[Date]) = @Year THEN (a.[Hours] + a.[Minutes] / 60.0) ELSE 0 END), 0) AS [MonthHours],
        ISNULL(SUM(a.[Hours] + a.[Minutes] / 60.0), 0) AS [TotalHours],
        ISNULL(SUM(CASE WHEN MONTH(a.[Date]) = @Month AND YEAR(a.[Date]) = @Year THEN 1 ELSE 0 END), 0) AS [ActivityCount]
    FROM [dbo].[Projects] p
    LEFT JOIN [dbo].[Activities] a ON p.[Id] = a.[ProjectId] AND p.[UserId] = a.[UserId]
    WHERE p.[UserId] = @UserId
    GROUP BY p.[Id], p.[Name], p.[UserId], p.[CreatedAt]
    ORDER BY p.[Name];
END
GO

-- =============================================
-- usp_GetReportData
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetReportData')
    DROP PROCEDURE [dbo].[usp_GetReportData];
GO
CREATE PROCEDURE [dbo].[usp_GetReportData]
    @ProjectId INT,
    @UserId INT,
    @Month INT,
    @Year INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.[Id], a.[ProjectId], a.[UserId], a.[Date], a.[Description], a.[Hours], a.[Minutes], a.[Icon], a.[Importance], a.[CreatedAt], u.[Username]
    FROM [dbo].[Activities] a
    INNER JOIN [dbo].[Users] u ON a.[UserId] = u.[Id]
    WHERE a.[ProjectId] = @ProjectId AND a.[UserId] = @UserId
        AND MONTH(a.[Date]) = @Month AND YEAR(a.[Date]) = @Year
    ORDER BY a.[Date] DESC;
END
GO

-- =============================================
-- usp_SeedUsers (insert default users)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_SeedUsers')
    DROP PROCEDURE [dbo].[usp_SeedUsers];
GO
CREATE PROCEDURE [dbo].[usp_SeedUsers]
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM [dbo].[Users])
    BEGIN
        INSERT INTO [dbo].[Users] ([Username], [PasswordHash], [Role]) VALUES
            ('lhernanb', '', 'admin'),
            ('dgarcia', '', 'user'),
            ('creyesg', '', 'user'),
            ('JCABELLS', '', 'user'),
            ('OQUINTAA', '', 'user');
        SELECT 'Users seeded successfully' AS [Message];
    END
    ELSE
        SELECT 'Users already exist' AS [Message];
END
GO

-- =============================================
-- usp_GetAllUsers (admin only)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetAllUsers')
    DROP PROCEDURE [dbo].[usp_GetAllUsers];
GO
CREATE PROCEDURE [dbo].[usp_GetAllUsers]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [Id], [Username], [Role], [CreatedAt]
    FROM [dbo].[Users]
    ORDER BY [Username];
END
GO

-- =============================================
-- usp_CreateUser (admin only)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_CreateUser')
    DROP PROCEDURE [dbo].[usp_CreateUser];
GO
CREATE PROCEDURE [dbo].[usp_CreateUser]
    @Username NVARCHAR(100),
    @PasswordHash NVARCHAR(500),
    @Role NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM [dbo].[Users] WHERE LOWER([Username]) = LOWER(@Username))
    BEGIN
        SELECT CAST(0 AS BIT) AS [Success], CAST(NULL AS INT) AS [Id], CAST(NULL AS NVARCHAR(100)) AS [Username], CAST(NULL AS NVARCHAR(20)) AS [Role], CAST(NULL AS DATETIME2) AS [CreatedAt];
        RETURN;
    END
    INSERT INTO [dbo].[Users] ([Username], [PasswordHash], [Role]) VALUES (@Username, @PasswordHash, @Role);
    SELECT CAST(1 AS BIT) AS [Success], [Id], [Username], [Role], [CreatedAt]
    FROM [dbo].[Users]
    WHERE [Id] = SCOPE_IDENTITY();
END
GO

-- =============================================
-- usp_UpdateUserPassword (admin only)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_UpdateUserPassword')
    DROP PROCEDURE [dbo].[usp_UpdateUserPassword];
GO
CREATE PROCEDURE [dbo].[usp_UpdateUserPassword]
    @UserId INT,
    @NewPasswordHash NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Users] SET [PasswordHash] = @NewPasswordHash WHERE [Id] = @UserId;
    SELECT @@ROWCOUNT AS [RowsAffected];
END
GO

-- =============================================
-- usp_GetAdminDashboard
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetAdminDashboard')
    DROP PROCEDURE [dbo].[usp_GetAdminDashboard];
GO
CREATE PROCEDURE [dbo].[usp_GetAdminDashboard]
    @Month INT,
    @Year INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.[Id] AS UserId,
        u.[Username],
        p.[Id] AS ProjectId,
        p.[Name] AS ProjectName,
        ISNULL(SUM(a.[Hours] + a.[Minutes] / 60.0), 0) AS TotalHours,
        COUNT(a.[Id]) AS ActivityCount
    FROM [dbo].[Users] u
    INNER JOIN [dbo].[Projects] p ON p.[UserId] = u.[Id]
    LEFT JOIN [dbo].[Activities] a ON a.[ProjectId] = p.[Id] AND a.[UserId] = u.[Id]
        AND MONTH(a.[Date]) = @Month AND YEAR(a.[Date]) = @Year
    GROUP BY u.[Id], u.[Username], p.[Id], p.[Name]
    ORDER BY u.[Username], p.[Name];
END
GO

-- =============================================
-- usp_UpdateUser (admin only)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_UpdateUser')
    DROP PROCEDURE [dbo].[usp_UpdateUser];
GO
CREATE PROCEDURE [dbo].[usp_UpdateUser]
    @UserId INT,
    @NewUsername NVARCHAR(100),
    @NewRole NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM [dbo].[Users] WHERE LOWER([Username]) = LOWER(@NewUsername) AND [Id] <> @UserId)
    BEGIN
        SELECT CAST(0 AS BIT) AS [Success];
        RETURN;
    END
    UPDATE [dbo].[Users] SET [Username] = @NewUsername, [Role] = @NewRole WHERE [Id] = @UserId;
    SELECT [Id], [Username], [Role], [CreatedAt] FROM [dbo].[Users] WHERE [Id] = @UserId;
END
GO

-- =============================================
-- usp_GetUserActivities (admin only)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetUserActivities')
    DROP PROCEDURE [dbo].[usp_GetUserActivities];
GO
CREATE PROCEDURE [dbo].[usp_GetUserActivities]
    @UserId INT,
    @Month INT,
    @Year INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.[Id], a.[ProjectId], a.[UserId], a.[Date], a.[Description], a.[Hours], a.[Minutes], a.[Icon], a.[Importance], a.[CreatedAt], u.[Username], p.[Name] AS ProjectName
    FROM [dbo].[Activities] a
    INNER JOIN [dbo].[Users] u ON a.[UserId] = u.[Id]
    INNER JOIN [dbo].[Projects] p ON a.[ProjectId] = p.[Id]
    WHERE a.[UserId] = @UserId AND MONTH(a.[Date]) = @Month AND YEAR(a.[Date]) = @Year
    ORDER BY a.[Date] DESC, a.[CreatedAt] DESC;
END
GO
