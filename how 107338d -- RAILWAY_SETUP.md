[33mcommit 107338dd2a7d9be2f3d7b17a84d36e631826652a[m
Author: Juan José García Siri <juanjo28599@gmail.com>
Date:   Tue Oct 7 09:25:31 2025 -0300

    fix: Solucionar problemas de seguridad y URLs
    
     SEGURIDAD:
    - Remover contraseñas hardcodeadas del código
    - ADMIN_PASSWORD ahora solo desde variables de entorno
    - Limpiar documentación con contraseñas de ejemplo
    - Agregar validación de configuración requerida
    
     URLs MEJORADAS:
    - Mejorar generación de slugs para nombres cortos
    - Si nombre < 5 caracteres, usar 'search-{country}-{sector}'
    - URLs más descriptivas y amigables
    
     Ejemplo de URL mejorada:
    - ANTES: /imm#c=27551367&s=27817676
    - AHORA: /search-27551367-27817676#c=27551367&s=27817676
    
     ACCIÓN REQUERIDA:
    - Configurar ADMIN_PASSWORD en Railway
    - Cambiar contraseña actual por seguridad

RAILWAY_SETUP.md
VARIABLES_ENTORNO.md
backend/SECURITY_SETUP.md
backend/dailyNewsletter.js
backend/middleware/auth.js
backend/server.js
