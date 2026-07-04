using System;
using System.Security.Cryptography;
using System.Text;

namespace ControlActividades.Services
{
    public static class PasswordHelper
    {
        private const string SALT = "ControlActividades_Salt_2024";

        public static string HashPassword(string password)
        {
            var saltBytes = Encoding.UTF8.GetBytes(SALT);
            var saltBase64 = Convert.ToBase64String(saltBytes);

            var combined = SALT + password;
            var combinedBytes = Encoding.UTF8.GetBytes(combined);
            var hashBytes = SHA256.Create().ComputeHash(combinedBytes);
            var hashBase64 = Convert.ToBase64String(hashBytes);

            return $"{saltBase64}:{hashBase64}";
        }

        public static bool VerifyPassword(string password, string storedHash)
        {
            if (string.IsNullOrEmpty(storedHash) || !storedHash.Contains(":"))
                return false;

            var parts = storedHash.Split(':');
            if (parts.Length != 2)
                return false;

            var saltBase64 = parts[0];
            var storedHashBase64 = parts[1];

            var saltBytes = Convert.FromBase64String(saltBase64);
            var salt = Encoding.UTF8.GetString(saltBytes);

            var combined = salt + password;
            var combinedBytes = Encoding.UTF8.GetBytes(combined);
            var hashBytes = SHA256.Create().ComputeHash(combinedBytes);
            var computedHashBase64 = Convert.ToBase64String(hashBytes);

            return computedHashBase64 == storedHashBase64;
        }
    }
}
