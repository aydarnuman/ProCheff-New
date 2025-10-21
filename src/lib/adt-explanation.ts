import { jsPDF } from "jspdf";

interface ADTExplanationData {
  tenderTitle: string;
  tenderCode: string;
  offerAmount: number;
  adtThreshold: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  companyName: string;
  explanationText: string;
  justifications: string[];
  contactInfo: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };
}

export class ADTExplanationPDF {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
    // Türkçe karakter desteği için helvetica kullan
    this.doc.setFont("helvetica");
  }

  generatePDF(data: ADTExplanationData): ArrayBuffer {
    this.addHeader(data);
    this.addTenderInfo(data);
    this.addADTAnalysis(data);
    this.addExplanation(data);
    this.addJustifications(data);
    this.addContact(data);
    this.addFooter();

    return this.doc.output("arraybuffer") as ArrayBuffer;
  }

  private addHeader(data: ADTExplanationData): void {
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(16);
    // ASCII-safe başlık
    this.doc.text("ANORMAL DERECEDE DUSUK TEKLIF ACIKLAMASI", 20, 30);

    // Alt başlık - Türkçe transliterasyonu
    this.doc.setFontSize(12);
    this.doc.text("(Abnormally Low Tender Explanation)", 20, 42);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(12);
    this.doc.text(
      `Hazirlik Tarihi: ${new Date().toLocaleDateString("tr-TR")}`,
      20,
      55
    );
    this.doc.text(`Referans: ${data.tenderCode}`, 20, 65);
  }

  private addTenderInfo(data: ADTExplanationData): void {
    let yPos = 85;

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.text("İHALE BİLGİLERİ", 20, yPos);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    yPos += 15;

    this.doc.text(`İhale Adı: ${data.tenderTitle}`, 20, yPos);
    yPos += 10;
    this.doc.text(`İhale Kodu: ${data.tenderCode}`, 20, yPos);
    yPos += 10;
    this.doc.text(`Firma: ${data.companyName}`, 20, yPos);
    yPos += 10;
    this.doc.text(
      `Teklif Tutarı: ${data.offerAmount.toLocaleString("tr-TR")} TRY`,
      20,
      yPos
    );
  }

  private addADTAnalysis(data: ADTExplanationData): void {
    let yPos = 135;

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.text("ADT ANALİZİ", 20, yPos);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    yPos += 15;

    this.doc.text(
      `ADT Eşiği: ${data.adtThreshold.toLocaleString("tr-TR")} TRY`,
      20,
      yPos
    );
    yPos += 10;

    const difference = data.adtThreshold - data.offerAmount;
    const percentage = ((difference / data.adtThreshold) * 100).toFixed(2);

    this.doc.text(
      `Fark: ${difference.toLocaleString("tr-TR")} TRY (% ${percentage})`,
      20,
      yPos
    );
    yPos += 10;

    const riskText = this.getRiskText(data.riskLevel);
    this.doc.text(`Risk Seviyesi: ${data.riskLevel} - ${riskText}`, 20, yPos);
  }

  private addExplanation(data: ADTExplanationData): void {
    let yPos = 185;

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.text("AÇIKLAMA", 20, yPos);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    yPos += 15;

    // Metni satırlara böl
    const lines = this.doc.splitTextToSize(data.explanationText, 170);
    for (const line of lines) {
      this.doc.text(line, 20, yPos);
      yPos += 6;
    }
  }

  private addJustifications(data: ADTExplanationData): void {
    let yPos = 220;

    if (yPos > 250) {
      this.doc.addPage();
      yPos = 30;
    }

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.text("GEREKÇELENDİRME", 20, yPos);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    yPos += 15;

    data.justifications.forEach((justification, index) => {
      if (yPos > 270) {
        this.doc.addPage();
        yPos = 30;
      }

      this.doc.text(`${index + 1}. ${justification}`, 25, yPos);
      yPos += 10;
    });
  }

  private addContact(data: ADTExplanationData): void {
    let yPos = 250;

    if (yPos > 270) {
      this.doc.addPage();
      yPos = 30;
    }

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.text("İLETİŞİM BİLGİLERİ", 20, yPos);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    yPos += 15;

    this.doc.text(`Sorumlu: ${data.contactInfo.name}`, 20, yPos);
    yPos += 10;
    this.doc.text(`Unvan: ${data.contactInfo.title}`, 20, yPos);
    yPos += 10;
    this.doc.text(`Telefon: ${data.contactInfo.phone}`, 20, yPos);
    yPos += 10;
    this.doc.text(`E-posta: ${data.contactInfo.email}`, 20, yPos);
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9);
      this.doc.text(
        `Bu belge ProCheff ADT Analiz Sistemi tarafından otomatik olarak oluşturulmuştur.`,
        20,
        285
      );
      this.doc.text(`Sayfa ${i} / ${pageCount}`, 170, 285);
    }
  }

  private getRiskText(riskLevel: string): string {
    switch (riskLevel) {
      case "HIGH":
        return "Yüksek risk, detaylı inceleme gerekli";
      case "MEDIUM":
        return "Orta risk, standart prosedürler uygulanabilir";
      case "LOW":
        return "Düşük risk, minimal gerekçelendirme yeterli";
      default:
        return "Belirsiz risk seviyesi";
    }
  }
}

// React komponenti için hook - sadece client-side
export const useADTExplanation = () => {
  const generatePDF = async (data: ADTExplanationData): Promise<Blob> => {
    // Dinamik import ile client-side only
    if (typeof window === "undefined") {
      throw new Error("PDF generation is only available on client-side");
    }

    const pdfGenerator = new ADTExplanationPDF();
    const arrayBuffer = pdfGenerator.generatePDF(data);
    return new Blob([arrayBuffer], { type: "application/pdf" });
  };

  const downloadPDF = async (
    data: ADTExplanationData,
    filename?: string
  ): Promise<void> => {
    const blob = await generatePDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      filename || `ADT-Aciklama-${data.tenderCode}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { generatePDF, downloadPDF };
};

// Örnek veri şablonu
export const createExampleADTData = (): ADTExplanationData => ({
  tenderTitle: "Okul Yemek Hizmeti İhalesi",
  tenderCode: "YMK-2024-001",
  offerAmount: 485000,
  adtThreshold: 500000,
  riskLevel: "MEDIUM",
  companyName: "ABC Catering Ltd. Şti.",
  explanationText:
    "Teklifimiz piyasa koşulları ve maliyet optimizasyonları dikkate alınarak hazırlanmıştır. Şirketimizin köklü deneyimi ve tedarik zinciri avantajları sayesinde kaliteli hizmeti daha uygun maliyetle sunabilmekteyiz.",
  justifications: [
    "Tedarik zincirimizde doğrudan üretici anlaşmaları mevcut",
    "Mevcut işgücü kaynakları optimum seviyede kullanılacak",
    "Teknolojik altyapı yatırımları tamamlanmış durumda",
    "Bölgesel lojistik avantajlarımız maliyet tasarrufu sağlamaktadır",
  ],
  contactInfo: {
    name: "Ahmet Yılmaz",
    title: "Proje Müdürü",
    phone: "+90 212 555 0123",
    email: "ahmet.yilmaz@abccatering.com",
  },
});

export type { ADTExplanationData };
