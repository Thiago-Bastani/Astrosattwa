# Configuração de Ícones e Splash Screen - Astrosattwa

## 🌟 Logo Criado
✅ **Estrela Dourada Cadente** criada em:
- `src/assets/logo-star.svg` - Logo decorativo  
- `resources/icon.svg` - Ícone do app (1024x1024)
- `resources/splash.svg` - Tela de splash (2732x2732)

## 📱 PASSO A PASSO COMPLETO

### **Passo 1: Converter SVG para PNG** 
Os arquivos SVG precisam ser convertidos para PNG:

#### Opção A - Online (Mais fácil):
1. Abra https://convertio.co/svg-png/
2. Faça upload de `resources/icon.svg`
3. Configure resolução: **1024x1024px**
4. Baixe como `icon.png` na pasta `resources/`
5. Repita para `splash.svg` como **2732x2732px** → `splash.png`

#### Opção B - Inkscape (se instalado):
```bash
inkscape resources/icon.svg --export-png=resources/icon.png --export-width=1024
inkscape resources/splash.svg --export-png=resources/splash.png --export-width=2732
```

### **Passo 2: Gerar Ícones Automaticamente**  
```bash
# Na pasta do projeto:
npx capacitor-assets generate --android
```

### **Passo 3: Atualizar o projeto Android**
```bash
npm run build
npx cap sync android
```

## 🛠️ MÉTODO ALTERNATIVO - Android Studio

Se preferir fazer manualmente:

### **1. Abrir projeto:**
```bash
npx cap open android
```

### **2. Gerar ícones adaptivos:**
1. No Android Studio: `File > New > Image Asset`
2. **Foreground Layer**: Selecione seu `icon.png`  
3. **Background Layer**: Cor sólida `#0f0f23`
4. **Shape**: None (para manter estrela)
5. Clique **Next > Finish**

### **3. Configurar Splash Screen:**
1. Navegue: `app > res > values > styles.xml`
2. Adicione tema do splash:
```xml
<style name="AppTheme.SplashScreen" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">@color/splash_bg</item>
    <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
</style>
```

3. Em `app > res > values > colors.xml`:
```xml
<color name="splash_bg">#0f0f23</color>
```

## ⚙️ Configuração Atual (Já aplicada):

### capacitor.config.ts:
```typescript
plugins: {
  SplashScreen: {
    launchAutoHide: true,
    launchShowDuration: 2000,
    backgroundColor: "#0f0f23",
    androidSplashResourceName: "splash",
    showSpinner: false,
  }
}
```

## 📋 Tamanhos gerados automaticamente:

### Ícones Android:
- **mdpi**: 48x48px  
- **hdpi**: 72x72px
- **xhdpi**: 96x96px
- **xxhdpi**: 144x144px
- **xxxhdpi**: 192x192px

### Splash Screens:
- **mdpi**: 320x480px
- **hdpi**: 480x800px  
- **xhdpi**: 720x1280px
- **xxhdpi**: 1080x1920px
- **xxxhdpi**: 1440x2560px

## 🚀 Comandos Finais:

```bash
# 1. Converter SVGs para PNG (manual ou online)
# 2. Gerar ícones:
npx capacitor-assets generate --android

# 3. Build e sync:  
npm run build
npx cap sync android

# 4. Testar:
npx cap run android
```

## ✨ Resultado Esperado:
- 🌟 Ícone com estrela dourada no launcher
- 🌌 Splash screen com estrela centralizada (2s)
- 🎨 Cores temáticas: dourado sobre fundo escuro celestial