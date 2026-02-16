# Environment Variables Reference

## Overview

All sensitive configuration is stored in environment variables, loaded from the `.env` file (development) or Render dashboard (production).

## Variable Reference

### Django Configuration

| Variable        | Type                     | Default             | Required | Description                                                                   |
| --------------- | ------------------------ | ------------------- | -------- | ----------------------------------------------------------------------------- |
| `SECRET_KEY`    | String                   | django-insecure-... | ✅ Yes   | Django secret key for cryptographic signing. **Must be unique in production** |
| `DEBUG`         | Boolean                  | False               | ❌ No    | Django debug mode. Must be `False` in production                              |
| `ALLOWED_HOSTS` | String (comma-separated) | localhost,127.0.0.1 | ✅ Yes   | List of allowed hostnames for the application                                 |

### Database Configuration

| Variable       | Type    | Default                       | Required        | Description                                    |
| -------------- | ------- | ----------------------------- | --------------- | ---------------------------------------------- |
| `DATABASE_URL` | String  | -                             | ✅ Yes (Render) | Full PostgreSQL connection string (for Render) |
| `DB_ENGINE`    | String  | django.db.backends.postgresql | ❌ No           | Database engine to use                         |
| `DB_NAME`      | String  | edcm_db                       | ❌ No           | Database name                                  |
| `DB_USER`      | String  | edcm_user                     | ❌ No           | Database username                              |
| `DB_PASSWORD`  | String  | -                             | ✅ Yes          | Database password                              |
| `DB_HOST`      | String  | localhost                     | ❌ No           | Database host address                          |
| `DB_PORT`      | Integer | 5432                          | ❌ No           | Database port number                           |

### CORS & Security

| Variable                | Type                     | Default               | Required | Description                                                  |
| ----------------------- | ------------------------ | --------------------- | -------- | ------------------------------------------------------------ |
| `CORS_ALLOWED_ORIGINS`  | String (comma-separated) | http://localhost:3000 | ✅ Yes   | Allowed frontend URLs for CORS                               |
| `CSRF_TRUSTED_ORIGINS`  | String (comma-separated) | -                     | ❌ No    | Trusted origins for CSRF protection                          |
| `SECURE_SSL_REDIRECT`   | Boolean                  | False                 | ✅ Yes   | Redirect HTTP to HTTPS. **Must be True in production**       |
| `SESSION_COOKIE_SECURE` | Boolean                  | False                 | ✅ Yes   | Send cookies only over HTTPS. **Must be True in production** |
| `CSRF_COOKIE_SECURE`    | Boolean                  | False                 | ✅ Yes   | CSRF cookie HTTPS only. **Must be True in production**       |

### API & Frontend URLs

| Variable       | Type   | Default                    | Required | Description              |
| -------------- | ------ | -------------------------- | -------- | ------------------------ |
| `API_URL`      | String | http://localhost:8000/api/ | ❌ No    | Backend API base URL     |
| `FRONTEND_URL` | String | http://localhost:3000      | ❌ No    | Frontend application URL |

### Email Configuration (Optional)

| Variable              | Type    | Default          | Required | Description                             |
| --------------------- | ------- | ---------------- | -------- | --------------------------------------- |
| `EMAIL_BACKEND`       | String  | console          | ❌ No    | Email backend to use                    |
| `EMAIL_HOST`          | String  | smtp.gmail.com   | ❌ No    | SMTP server host                        |
| `EMAIL_PORT`          | Integer | 587              | ❌ No    | SMTP server port                        |
| `EMAIL_USE_TLS`       | Boolean | True             | ❌ No    | Use TLS for email                       |
| `EMAIL_HOST_USER`     | String  | -                | ❌ No    | Email sender address                    |
| `EMAIL_HOST_PASSWORD` | String  | -                | ❌ No    | Email password or app-specific password |
| `DEFAULT_FROM_EMAIL`  | String  | noreply@edcm.com | ❌ No    | Default sender email                    |

### AWS S3 Configuration (Optional)

| Variable                  | Type   | Default   | Required | Description    |
| ------------------------- | ------ | --------- | -------- | -------------- |
| `AWS_ACCESS_KEY_ID`       | String | -         | ❌ No    | AWS access key |
| `AWS_SECRET_ACCESS_KEY`   | String | -         | ❌ No    | AWS secret key |
| `AWS_STORAGE_BUCKET_NAME` | String | -         | ❌ No    | S3 bucket name |
| `AWS_S3_REGION_NAME`      | String | us-east-1 | ❌ No    | S3 region      |

---

## Example Configurations

### Development (.env)

```env
SECRET_KEY=django-insecure-gmahhygx^a0*(ufq09_f81$$kvd)mq&er_^x()
DEBUG=True
DB_PASSWORD=dev_password
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

### Production (Render Dashboard)

```
SECRET_KEY=<new-generated-key>
DEBUG=False
CORS_ALLOWED_ORIGINS=https://edcm.onrender.com
DATABASE_URL=postgresql://...@...
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

---

## How to Generate a Secure SECRET_KEY

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

---

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore` for a reason
2. **Use `.env.example`** - Commit this as a template without secrets
3. **Rotate `SECRET_KEY`** - Regenerate for each new production deployment
4. **Use strong passwords** - Database password should be 12+ characters
5. **Enable SSL in production** - Set `SECURE_SSL_REDIRECT=True`
6. **Different keys per environment** - Don't reuse development secrets
7. **Use environment-specific configuration** - Load sensitive vars from `.env` files or secure vaults

---

## Troubleshooting

### "SECRET_KEY setting is invalid"

- Ensure `SECRET_KEY` is unique and contain valid characters
- Use the generation command above

### CORS errors

- Check `CORS_ALLOWED_ORIGINS` includes your frontend URL
- No trailing slashes in URLs

### Database connection failures

- Verify `DATABASE_URL` or individual database variables
- Ensure PostgreSQL is running (local dev)
- Check network access (production)

### Static files not found

- Run `python manage.py collectstatic --noinput`
- Check `STATIC_ROOT` and `STATICFILES_DIRS` in settings

---

**Last Updated:** February 2026
