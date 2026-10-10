# Checklist partner TUU (SUNMI / KOZEN)

Externo al Cloud Agent — bloquea terminal real. Fuentes:

- Partner SUNMI: https://developers.tuu.cl/docs/registrarse-como-partner
- Partner KOZEN: formulario Google Forms (docs TUU)
- InterApp: https://developers.tuu.cl/docs/integraci%C3%B3n-de-aplicaciones-de-pago-inter-app-new
- TUU Demo: https://developers.tuu.cl/docs/tuu-demo
- Publicar APK: https://developers.tuu.cl/docs/proceso-de-publicaci%C3%B3n-de-aplicaciones

## Pasos

1. [ ] Registrar partner SUNMI (Pro / SE / Mini) según flota.
2. [ ] Registrar partner KOZEN (PRO2) si aplica.
3. [ ] Validar identidad / licencia comercial; acceso portal partners.
4. [ ] Desarrollar APK integradora `sicr3p` (WebView o nativa) que invoque TUU Negocio vía Intent.
5. [ ] Probar con **TUU Demo** en dispositivo (pago, params, errores, impresión).
6. [ ] Publicar APK en App Store del fabricante.
7. [ ] Habilitar comercio / RUT en terminal.
8. [ ] Apuntar app a packages `com.haulmer.paymentapp.dev` → `com.haulmer.paymentapp`.

## Mientras tanto (este repo)

- Cobro mock en `lib/baas/tuu.js` + UI `/ops/pos`.
- Preview de payload InterApp en ops.
- No hay Global66 en el rail.
