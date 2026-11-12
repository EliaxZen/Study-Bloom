# Instalador e atualizações — Study Bloom

## Onde está o instalador neste PC (v0.1.0)

Mandar **este** pra ela (preferido):

`C:\Users\Administrator\Documents\Study-Bloom\dist-installers\nsis\Study Bloom_0.1.0_x64-setup.exe`

MSI (opcional):

`C:\Users\Administrator\Documents\Study-Bloom\dist-installers\msi\Study Bloom_0.1.0_x64_en-US.msi`

Assinaturas do updater (`.sig`) ficam na mesma pasta — ele usa na hora de montar o `latest.json`.

## Para ela (primeira instalação)

1. Receber o arquivo `Study Bloom_*_x64-setup.exe` (instalador NSIS).
2. Abrir o `.exe` (Windows pode pedir confirmação — “Mais informações” → Executar mesmo assim, se SmartScreen aparecer em builds não assinados pela Microsoft).
3. Seguir o assistente (instalação no perfil do usuário; não precisa de admin na config atual).
4. Abrir **Study Bloom** pelo menu Iniciar ou atalho.

**Requisito:** WebView2 (já vem no Windows 10/11 atualizados).

## Como funcionam as atualizações automáticas

1. Ao abrir o app (só no desktop Tauri), ele consulta em silêncio o manifesto remoto.
2. Se existir versão **maior**, aparece um diálogo pastel Study Bloom:
   - Título: “Tem uma versão nova do Study Bloom”
   - Notas da versão (changelog)
   - **Atualizar agora** / **Agora não**
   - Barra de progresso durante o download
3. Depois da instalação o app reabre na versão nova.

Enquanto o GitHub Release + `latest.json` não estiverem no ar, a checagem falha em silêncio (sem assustar).

### Fallback manual

Ele manda um novo instalador → ela roda por cima da instalação atual → dados continuam.

## Segurança dos dados (garantia)

| Dado | Onde fica | Sobrevive a update/reinstall? |
|------|-----------|-------------------------------|
| SQLite (`study-bloom.db`) | `%APPDATA%\com.studybloom.desktop\` | Sim |
| plugin-store Tauri | pasta de dados do app (AppData) | Sim |
| Preferências Zustand no WebView (ex.: foco) | storage do WebView do app | Em geral sim (mesmo identifier) |

**Não** ficam dentro de `C:\Program Files\...` nem da pasta que o instalador substitui.

## O que ele precisa ter feito pra auto-update “de verdade”

- Repo público/releases com `latest.json` + `.exe` + `.sig`
- Endpoint no `tauri.conf.json` batendo com o host real
- Mesma chave privada usada em todo build futuro

Detalhes: `docs/PUBLISH.md`.
