@echo off
REM ProCheff AI - Environment Setup Script for Windows
REM Bu script .env.local dosyasını otomatik olarak oluşturur

echo.
echo 🔐 ProCheff AI - Environment Kurulum Scripti
echo ==============================================
echo.

REM Check if .env.local already exists
if exist ".env.local" (
    echo ⚠️  .env.local dosyası zaten mevcut!
    set /p "overwrite=Üzerine yazmak istiyor musunuz? (Y/N): "
    if /i not "%overwrite%"=="Y" (
        echo ❌ İşlem iptal edildi.
        exit /b 1
    )
    echo 📝 Mevcut dosya yedekleniyor...
    copy ".env.local" ".env.local.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
)

REM Check if .env.example exists
if not exist ".env.example" (
    echo ❌ Hata: .env.example dosyası bulunamadı!
    exit /b 1
)

REM Copy example file
echo 📋 .env.example dosyasından kopyalanıyor...
copy ".env.example" ".env.local"

echo ✅ .env.local dosyası oluşturuldu!
echo.
echo 📝 Şimdi yapmanız gerekenler:
echo.
echo 1. .env.local dosyasını bir text editör ile açın:
echo    notepad .env.local
echo    # veya
echo    code .env.local
echo.
echo 2. ANTHROPIC_API_KEY değerini gerçek API anahtarınız ile değiştirin:
echo    ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key
echo.
echo 3. (İsteğe bağlı) Diğer API anahtarlarını da ekleyin
echo.
echo 4. Geliştirme sunucusunu başlatın:
echo    npm run dev
echo.
echo 📚 Detaylı bilgi için ENV_SETUP.md dosyasına bakın:
echo    type ENV_SETUP.md
echo.
echo 🎉 Hazırsınız! İyi çalışmalar!
echo.
pause
