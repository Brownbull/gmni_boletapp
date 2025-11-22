# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "Ayni" [level=1] [ref=e6]
  - generic [ref=e7]:
    - heading "Inicia sesión en tu cuenta" [level=2] [ref=e8]
    - paragraph [ref=e9]:
      - text: ¿No tienes cuenta?
      - link "Regístrate" [ref=e10] [cursor=pointer]:
        - /url: /register
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Correo electrónico
        - textbox "Correo electrónico" [ref=e16]
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: Contraseña
          - textbox "Contraseña" [ref=e22]
        - button "Show password" [ref=e23] [cursor=pointer]:
          - img [ref=e24]
      - link "¿Olvidaste tu contraseña?" [ref=e28] [cursor=pointer]:
        - /url: /forgot-password
      - button "Iniciar sesión" [ref=e29] [cursor=pointer]
    - generic [ref=e30]:
      - generic [ref=e35]: Or continue with
      - button "Sign in with Google" [ref=e37] [cursor=pointer]:
        - img [ref=e38]
        - generic [ref=e43]: Continuar con Google
  - generic [ref=e44]:
    - link "Privacy" [ref=e45] [cursor=pointer]:
      - /url: "#"
    - text: •
    - link "Terms" [ref=e46] [cursor=pointer]:
      - /url: "#"
    - text: •
    - link "Help" [ref=e47] [cursor=pointer]:
      - /url: "#"
```