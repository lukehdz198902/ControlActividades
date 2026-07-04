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
            var saltBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(SALT));

            var combined = saltBase64 + password;
            var hashBytes = SHA256.Create().ComputeHash(Encoding.UTF8.GetBytes(combined));

            return $"{saltBase64}:{Convert.ToBase64String(hashBytes)}";
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

            var combined = saltBase64 + password;
            var computedHashBase64 = Convert.ToBase64String(
                SHA256.Create().ComputeHash(Encoding.UTF8.GetBytes(combined))
            );

            return computedHashBase64 == storedHashBase64;
        }
    }
}
