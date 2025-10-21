OCR.space API Key — Kurulum ve kullanım

Bu döküman, OCR.space API anahtarının (OCR_SPACE_API_KEY) nasıl oluşturulacağı, güvenli şekilde nasıl saklanacağı ve projenizde nasıl kullanılacağıyla ilgili kısa talimatları içerir.

1) Hesap ve API anahtarı alma
- OCR.space'e gidin: https://ocr.space/
- "Get API Key" veya "Sign up" yoluyla bir hesap oluşturun.
- Hesabınıza giriş yaptıktan sonra dashboard veya account bölümünde API anahtarınızı bulun ve kopyalayın.

2) GitHub Actions için (güvenli) saklama
- Repository -> Settings -> Secrets and variables -> Actions -> "New repository secret"
  - Name: OCR_SPACE_API_KEY
  - Value: (kopyaladığınız API anahtarı)
- Bizim CI workflow'umuz `OCR_SPACE_API_KEY` secret'ını kullanacak şekilde ayarlanmıştır. Secret eklenmeden CI çalıştırıldığında cloud OCR fallback başarısız olabilir.

3) Yerel geliştirme / Codespace
- Geçici olarak terminal oturumunda kullanmak için:
  - export OCR_SPACE_API_KEY="<YOUR_KEY>"
- Veya proje kökünde `.env` kullanıyorsanız (`.env` hiçbir zaman commit edilmemeli):
  - `.env`
    OCR_SPACE_API_KEY=your_api_key_here
- Codespaces veya benzer bulut geliştirme ortamlarında, ilgili ortamın "Secrets" veya "Environment variables" ayarına anahtarı ekleyin.

4) gh CLI ile secret ekleme (opsiyonel)
- GitHub CLI yüklüyse:
  - gh secret set OCR_SPACE_API_KEY --body "<YOUR_KEY>"
  - Eğer repository seviyesi belirtilmesi gerekiyorsa: `--repo owner/repo` ekleyin.

5) Test etme
- Lokal test (terminal):
  - export OCR_SPACE_API_KEY="<YOUR_KEY>"
  - node scripts/extract-sample.js pmyo-sartname.pdf 2
- CI: secret eklendikten sonra workflow otomatik olarak veya manuel tetiklemede OCR.space fallback kullanabilir.

6) Güvenlik ve maliyet
- API anahtarınızı asla versiyon kontrol sistemine (Git) commit etmeyin.
- Ücretsiz/ücretli plan limitlerini kontrol edin; büyük PDF iş yüklerinde maliyet doğabilir.

Not: Projeye cloud fallback eklendi; fakat en sağlıklısı Docker/host ortamına `libvips + poppler` kurup Sharp ile lokal rasterizasyon yapmaktır. Cloud fallback geçici veya Codespaces gibi kısıtlı ortamlarda faydalıdır.
