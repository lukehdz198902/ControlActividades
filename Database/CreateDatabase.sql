-- =============================================
-- Database: ControlActividades
-- Description: Actividades multi-user platform
-- =============================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ControlActividades')
BEGIN
    CREATE DATABASE [ControlActividades];
END
GO

USE [ControlActividades];
GO

-- Users table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Users] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Username] NVARCHAR(100) NOT NULL UNIQUE,
        [PasswordHash] NVARCHAR(500) NOT NULL,
        [Role] NVARCHAR(20) NOT NULL DEFAULT 'user',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Projects table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Projects] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Name] NVARCHAR(255) NOT NULL,
        [UserId] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_Projects_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
        CONSTRAINT [UQ_Projects_User_Name] UNIQUE ([Name], [UserId])
    );
END
GO

-- Activities table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Activities]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Activities] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ProjectId] INT NOT NULL,
        [UserId] INT NOT NULL,
        [Date] DATE NOT NULL,
        [Description] NVARCHAR(MAX) NOT NULL,
        [Hours] INT NOT NULL DEFAULT 0,
        [Minutes] INT NOT NULL DEFAULT 0,
        [Icon] NVARCHAR(10) NOT NULL DEFAULT '💻',
        [Importance] NVARCHAR(20) NOT NULL DEFAULT 'Media',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_Activities_Projects] FOREIGN KEY ([ProjectId]) REFERENCES [dbo].[Projects]([Id]),
        CONSTRAINT [FK_Activities_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id])
    );
END
GO
