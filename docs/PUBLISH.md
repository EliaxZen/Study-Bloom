# Publicar o Study Bloom

Conta `gh` neste PC: **EliaxZen**.  
Por regra do projeto, **commits / push / releases no GitHub são manuais** (a IA não faz isso).

## 1. Repo no GitHub (uma vez)

```powershell
cd $env:USERPROFILE\Documents\Study-Bloom

git init
git add .
git status
git commit -m "chore: base organizada + docs para o Study Bloom"

gh repo create Study-Bloom --public --source=. --remote=origin --push
```

Depois a namorada pode fazer **fork** se quiser acompanhar o código.

## 2. Chaves de assinatura do updater (já geradas neste PC)

| Item | Onde |
|------|------|
| **Privada** (nunca compartilhar / nunca commitar) | `%USERPROFILE%\.tauri\study-bloom.key` |
| **Pública** (já está no app) | `app/src-tauri/tauri.conf.json` → `plugins.updater.pubkey` |

A chave privada atual foi gerada **sem senha**. Guarde um backup seguro do arquivo `.key`.  
Se perder a privada, quem já instalou o app **não consegue** receber updates assinados com uma chave nova (precisa reinstalar).

Variáveis no build (PowerShell):

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = "$env:USERPROFILE\.tauri\study-bloom.key"
# opcional, se no futuro a chave tiver senha:
# $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "sua-senha"
```

## 3. Publicar uma versão nova (checklist dele)

1. **Bump de versão** nos dois lugares (mesmo semver):
   - `app/package.json` → `"version"`
   - `app/src-tauri/tauri.conf.json` → `"version"`
   - `app/src-tauri/Cargo.toml` → `version` (opcional, mas recomendado)
2. Commit/push manuais (você).
3. No PowerShell:

```powershell
cd $env:USERPROFILE\Documents\Study-Bloom\app
$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path
$env:TAURI_SIGNING_PRIVATE_KEY = "$env:USERPROFILE\.tauri\study-bloom.key"
npm run build:tauri
```

4. Artefatos típicos (também copiados para `dist-installers\` após o build deste PC):

- NSIS (recomendado pro updater / pra mandar pra ela):  
  `dist-installers\nsis\Study Bloom_*_x64-setup.exe`  
  (espelho: `app\src-tauri\target\release\bundle\nsis\`)  
  + arquivo `.sig` ao lado
- MSI (opcional):  
  `dist-installers\msi\Study Bloom_*_x64_en-US.msi`

5. Monte o manifesto `latest.json` (modelo em `app/updater/latest.json.example`):
   - `version`: a nova versão
   - `notes`: texto amigável (aparece no diálogo do app)
   - `platforms.windows-x86_64.url`: URL **HTTPS** direta do `.exe` NSIS
   - `platforms.windows-x86_64.signature`: **conteúdo inteiro** do arquivo `.sig` (não o path)

6. Crie um **GitHub Release** (manual) com tag `vX.Y.Z` e anexe:
   - o `.exe` NSIS
   - o `.sig`
   - o `latest.json` (nome exato: `latest.json`)

Endpoint já configurado no app:

`https://github.com/EliaxZen/Study-Bloom/releases/latest/download/latest.json`

7. Na máquina dela: abrir o Study Bloom → se houver versão maior, aparece o diálogo pastel → **Atualizar agora**.

## 4. Antes do Releases existir

- Auto-update **não** completa sem URL pública + `latest.json` + assinatura.
- **Fallback:** mande o novo `*-setup.exe` por Drive/WhatsApp; ela instala por cima. Dados em AppData **não** são apagados.
- Para apontar outro host: edite `plugins.updater.endpoints` em `app/src-tauri/tauri.conf.json` e faça um novo build.

## 5. WebView2

Windows 10/11 modernos já têm. Se o app não abrir, instalar:  
[https://developer.microsoft.com/microsoft-edge/webview2/](https://developer.microsoft.com/microsoft-edge/webview2/)
