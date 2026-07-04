USE [ControlActividades];
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Users])
BEGIN
    INSERT INTO [dbo].[Users] ([Username], [PasswordHash]) VALUES
            ('lhernanb', 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:2KPK77F3FEpttLv5eAbc+rOjXbb0JT32ExmYscFdvgQ='),
            ('dgarcia', 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:swpoAfSo5EDvYekt2Xd19i60FVOtRgk/msphOvUlN/A='),
            ('creyesg', 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:0GLHagbmdEnnOLbn6E9Xcnc2g3OgdoeZYZyGIP1/b1w='),
            ('JCABELLS', 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:NPrA69TUmkdQsFdh/Yy24orwU5adhhcYuqjZrFSOpNc='),
            ('OQUINTAA', 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:48SR/76AMUVs7cshEeUNqx+2p+ynSQVYUuv4EpprpKs=');
    PRINT 'Default users inserted with hashed passwords';
END
ELSE
    PRINT 'Users already exist, updating hashes...';

-- Update passwords for existing users that have empty hashes
UPDATE [dbo].[Users] SET [PasswordHash] = CASE [Username]
        WHEN 'lhernanb' THEN 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:2KPK77F3FEpttLv5eAbc+rOjXbb0JT32ExmYscFdvgQ='
        WHEN 'dgarcia' THEN 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:swpoAfSo5EDvYekt2Xd19i60FVOtRgk/msphOvUlN/A='
        WHEN 'creyesg' THEN 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:0GLHagbmdEnnOLbn6E9Xcnc2g3OgdoeZYZyGIP1/b1w='
        WHEN 'JCABELLS' THEN 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:NPrA69TUmkdQsFdh/Yy24orwU5adhhcYuqjZrFSOpNc='
        WHEN 'OQUINTAA' THEN 'Q29udHJvbEFjdGl2aWRhZGVzX1NhbHRfMjAyNA==:48SR/76AMUVs7cshEeUNqx+2p+ynSQVYUuv4EpprpKs='
    END
WHERE [PasswordHash] = '' OR [PasswordHash] IS NULL;

-- Create sample projects for lhernanb (first user)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Projects])
BEGIN
    DECLARE @UserId INT = (SELECT TOP 1 [Id] FROM [dbo].[Users] WHERE [Username] = 'lhernanb');
    IF @UserId IS NOT NULL
    BEGIN
        INSERT INTO [dbo].[Projects] ([Name], [UserId]) VALUES
            ('Sailine', @UserId),
            ('PMTracker', @UserId),
            ('OPTracker', @UserId);
        PRINT 'Sample projects created';
    END
END
GO
