/**
 * SON MESAJ — 23.17
 * 2D Dedektiflik ve Vaka Çözme Oyunu
 * 
 * Vanilla JavaScript / TypeScript Oyun Motoru
 * Harici bağımlılık veya ücretli API gerektirmez.
 */

export interface Evidence {
  id: string;
  name: string;
  location: string;
  shortDesc: string;
  fullDesc: string;
  intel: string;
  suspects: string[];
  requiresArchive?: boolean;
}

export interface Suspect {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  initialStatement: string;
  questions: {
    q: string;
    a: string;
  }[];
  contradictionEvidenceId: string;
  contradictionPrompt: string;
  contradictionResponse: string;
  contradictionSuccessText: string;
}

export interface RelationRule {
  id: string;
  evidenceA: string;
  evidenceB: string;
  title: string;
  text: string;
  unlockedInfo?: string;
}

export interface TimelineItem {
  time: string;
  title: string;
  hiddenDesc: string;
  revealedDesc: string;
  revealedCondition: (state: GameState) => boolean;
}

export interface GameState {
  screen: 'start' | 'intro' | 'game' | 'final' | 'howToPlay';
  activeTab: 'scene' | 'evidence' | 'suspects' | 'interrogation' | 'timeline' | 'verdict';
  score: number;
  bestScore: number;
  collectedEvidence: string[]; // evidence IDs
  selectedEvidenceForRelation: string[]; // max 2 IDs
  discoveredRelations: string[]; // relation IDs
  solvedContradictions: string[]; // suspect IDs
  askedQuestions: Record<string, number[]>; // suspectId -> question indices
  selectedSuspectId: string;
  archiveUnlocked: boolean;
  finalEndingId: 'A' | 'B' | 'C' | 'D' | null;
  logs: string[];
  soundEnabled: boolean;
}

const STORAGE_KEY = 'son_mesaj_2317_save_v1';
const BEST_SCORE_KEY = 'son_mesaj_2317_best_score';

// Kanıt Listesi (7 Kanıt)
export const EVIDENCES: Evidence[] = [
  {
    id: 'kanit_1',
    name: 'Gizemli Mesaj',
    location: "Deniz'in Çalışma Masasındaki Akıllı Telefon",
    shortDesc: "Saat 23.17'de otomatik gönderilmiş şifreli son mesaj.",
    fullDesc: 'Deniz\'in kilit ekranında açık bırakılmış son giden mesaj:\n\n“Eğer bunu okuyorsan, yanlış kişiye güvendim. 00.30\'dan önce arşivi bul. Mavi anahtarın olduğu yere bak. Ve lütfen... Ece\'ye inanma.”',
    intel: 'Deniz 00.30\'a kadar bir şeylerin geri dönülemez olacağını biliyordu. Laboratuvardaki mavi anahtara ve eski arşive işaret ediyor.',
    suspects: ['Ece Yalın'],
  },
  {
    id: 'kanit_2',
    name: 'Mavi Anahtar',
    location: "Laboratuvar Çalışma Masası Kilitli Çekmecesi",
    shortDesc: 'Üzerinde el yazısıyla ARŞİV kazınmış mavi anahtar.',
    fullDesc: 'Çekmecenin arka gizli bölmesine saklanmış, üzerinde el yazısıyla kazınmış “ARŞİV” ibaresi bulunan küçük mavi pirinç anahtar.',
    intel: 'Eski araştırma arşivinin kilitli kapısını açmak için kullanılan anahtardır. Arşiv Odasını erişilebilir hale getirir.',
    suspects: ['Profesör Selim Er', 'Mert Kaya'],
  },
  {
    id: 'kanit_3',
    name: 'Güvenlik Kamera Kaydı',
    location: "B Blok Koridoru Güvenlik Monitörü",
    shortDesc: "Saat 23.08'de Mert'in laboratuvar koridoruna girdiğini gösteren kayıt.",
    fullDesc: 'Kuzgun Üniversitesi Güvenlik Merkezi B-12 kamerası zaman damgalı görüntüsü.\nSaat 23.08: Mert Kaya yüzünü kapüşonla kapatarak telaşla laboratuvar koridoruna giriyor.',
    intel: 'Mert\'in "Saat 23.00\'te yurttaydım ve hiç çıkmadım" resmi ifadesini doğrudan ve kesin olarak çürütür.',
    suspects: ['Mert Kaya'],
  },
  {
    id: 'kanit_4',
    name: 'Silinmiş Mesaj Dökümü',
    location: "Laboratuvar Bilgisayarı / Bulut Yedekleme Kayıtları",
    shortDesc: "Ece'nin telefon dökümünde bulunan silinmiş sohbet kaydı.",
    fullDesc: 'Sistem terminalinden kurtarılan anlık mesajlaşma günlüğü.\nSaat 22.42: Deniz\'den Ece\'ye giden silinmiş ileti:\n“Dosyaları buldum. Bunu kimseye söyleme. Bir kopyayı saklamalıyız.”',
    intel: 'Ece\'nin olay gecesi Deniz ile kritik bir sır paylaştığını gösterir. Ancak tek başına onun bir suçlu olduğunu kanıtlamaz.',
    suspects: ['Ece Yalın'],
  },
  {
    id: 'kanit_5',
    name: 'Arşiv Notu',
    location: "Eski Arşiv Odası - Araştırma Klasörü",
    shortDesc: 'Veri usulsüzlüğü ve sahteciliği ifşa eden el yazısı not.',
    fullDesc: 'Deniz Arman\'ın laboratuvar mührü basılı sarı not defteri sayfası:\n\n“Orijinal sonuçlar ile yayımlanan sonuçlar uyuşmuyor! İlaç yan etki verileri rapordan bilerek silinmiş. Kayıtların bir kopyasını korumalıyım. Erişim günlüğünü kontrol et.”',
    intel: 'Akademik araştırmada etik dışı veri tahrifatı yapıldığını ve Deniz\'in bu yüzden hedef haline geldiğini belgeler.',
    suspects: ['Profesör Selim Er'],
    requiresArchive: true,
  },
  {
    id: 'kanit_6',
    name: 'Islak Ayak İzleri',
    location: "Arka Koridor ve Acil Yangın Çıkışı",
    shortDesc: 'Yağmurlu gecede dış kapıya doğru ilerleyen çamurlu izler.',
    fullDesc: 'Laboratuvarın arka kapısından yangın merdivenlerine ve otopark yönüne doğru uzanan taze çamurlu ayakkabı izleri. İzlerde boğuşma veya sürüklenme emaresi yok.',
    intel: 'Deniz\'in kaçırılmadığı; orijinal verileri yanına alarak kendi isteğiyle hızla kampüsü terk edip güvenli bir yere sığındığı ihtimalini güçlendirir.',
    suspects: ['Deniz Arman'],
  },
  {
    id: 'kanit_7',
    name: 'Arşiv Erişim Günlüğü',
    location: "Eski Arşiv Kapısı Manyetik Kart Okuyucu Terminali",
    shortDesc: "Gece 23.25'te Profesör Selim Er'in kartıyla giriş yapıldığını gösteren log.",
    fullDesc: 'Dijital geçiş kontrol sistemi sunucu çıktısı:\n17 Ekim 2026, 23.25: [KART OKUNDU: #88219 - Prof. Dr. Selim Er]. Durum: Arşiv Odası Kapısı Açıldı.',
    intel: 'Profesör Selim\'in "O gece kampüse hiç gelmedim, evimde makale yazıyordum" resmi beyanını tamamen yerle bir eder.',
    suspects: ['Profesör Selim Er'],
    requiresArchive: true,
  },
];

// 3 Şüpheli
export const SUSPECTS: Suspect[] = [
  {
    id: 'ece',
    name: 'Ece Yalın',
    role: "Deniz'in Yakın Arkadaşı & Doktora Araştırmacısı",
    avatarColor: '#E06D53',
    initialStatement: '“Deniz son günlerde çok gergindi, benden bile uzaklaşmıştı. Saat 22.40\'ta koridorda birkaç dakika konuştuk ama bana hiçbir şey anlatmadı. O son mesajı ben almadım; bana iftira atmayın!”',
    questions: [
      {
        q: 'O gece Deniz\'i en son nerede ve ne zaman gördünüz?',
        a: 'Saat 22.40 civarında B Blok koridorundaydı. Yağmurluğunu giymişti, elleri titriyordu. \'Bir şey olursa arşivdeki kopyayı hatırla\' gibi bir şey geveledi ama anlam veremedim.',
      },
      {
        q: 'Deniz son mesajında neden "Ece\'ye inanma" diye yazmış olabilir?',
        a: 'Bilmiyorum... Gerçekten bilmiyorum! Belki de arkamda birilerinin beni dinlediğini sanıyordu ya da şüpheyi dağıtıp beni korumak istedi. Ben onun tek gerçek dostuydum!',
      },
      {
        q: 'Laboratuvardaki araştırma projesi hakkında ne biliyorsunuz?',
        a: 'Profesör Selim ve Mert\'le birlikte çalışıyorlardı. Deniz son iki haftadır klinik deney grafiklerini geceleri tek başına inceliyordu. \'Burada büyük bir sahtekarlık dönüyor\' demişti.',
      },
    ],
    contradictionEvidenceId: 'kanit_4', // Silinmiş Mesaj
    contradictionPrompt: 'Ece\'nin telefon dökümünden kurtarılan silinmiş mesajı göster:\n"Dosyaları buldum. Bunu kimseye söyleme."',
    contradictionResponse: '“Pekala dedektif... Haklısınız, artık saklamayacağım. Deniz o gece dehşet içindeydi. Dosyaları kopyalamıştı ve \'Bunu öğrenirlerse beni yok ederler\' dedi. Mesajı sildim çünkü hem Deniz\'i hem kendimi korumak istedim. Ama yemin ederim nereye kaçtığını bilmiyorum!”',
    contradictionSuccessText: 'Ece\'nin şüpheli tavırlarının sebebi çözüldü: Suç ortağı değil, Deniz\'in hayatından endişe eden gizli koruyucuydu.',
  },
  {
    id: 'mert',
    name: 'Mert Kaya',
    role: "Deniz'in Laboratuvar Arkadaşı & Tez Asistanı",
    avatarColor: '#4A90E2',
    initialStatement: '“O gece kampüste bile değildim. Saat 23.00\'te üniversite yurdundaydım, vizelerime çalışıyordum. Deniz\'in kaybolmasıyla hiçbir alakam yok.”',
    questions: [
      {
        q: 'Saat 23.00\'te yurtta olduğunuzu kanıtlayacak bir tanığınız var mı?',
        a: 'Oda arkadaşım erkenden uyumuştu. Ama odamdaydım işte dedektif, niye bana inanmıyorsunuz? Ben sabaha kadar not çıkardım.',
      },
      {
        q: 'Deniz ile laboratuvardaki ilişkiniz nasıldı?',
        a: 'Gayet profesyonel. Ama son zamanlarda takıntılı biri olmuştu. Herkesi casus gibi görüyordu, çalışma odasını bile kilitliyordu.',
      },
      {
        q: 'Arşiv odasındaki araştırma dosyalarıyla hiç ilgilendiniz mi?',
        a: 'Hayır, arşiv eski raporların atıldığı bir çöplük. Benim orayla hiçbir işim olmaz.',
      },
    ],
    contradictionEvidenceId: 'kanit_3', // Güvenlik Kaydı
    contradictionPrompt: 'Saat 23.08\'de Mert\'in laboratuvar koridoruna girdiğini gösteren Güvenlik Kamera Kaydını yüzüne vur:',
    contradictionResponse: '“Lanet olsun... Kameraların o açıyı aldığını bilmiyordum! Tamam, oradaydım! Ama yemin ederim Deniz\'e zarar vermedim! Profesör Selim telefon açtı; \'Deniz çıldırdı, odasındaki harici diski hemen almamız gerek\' dedi. Ben sadece bursumu kaybetmekten korkan bir asistanım!”',
    contradictionSuccessText: 'Mert\'in "yurttaydım" yalanı deşifre edildi! Profesör Selim\'in talimatıyla delilleri çalmaya geldiğini itiraf etti.',
  },
  {
    id: 'profesor',
    name: 'Prof. Dr. Selim Er',
    role: 'Bölüm Başkanı & Araştırma Projesi Yöneticisi',
    avatarColor: '#C9A66B',
    initialStatement: '“Deniz yetenekli fakat maalesef duygusal hezeyanları olan bir araştırmacıydı. O gece kampüse hiç gelmedim; evimde uluslararası hakemli dergi makalemi yazıyordum.”',
    questions: [
      {
        q: 'Deniz\'in projede veri tahrifatı yapıldığına dair şüpheleri doğru muydu?',
        a: 'Katiyen hayır! Genç araştırmacılar bazen önemsiz biyomedikal sapmaları komplo sanırlar. Projemiz bakanlık ve uluslararası fonlarca onaylanmış dev bir yatırımdır.',
      },
      {
        q: 'Mert Kaya\'ya o gece Deniz\'in odasından disk alması için talimat verdiniz mi?',
        a: 'Ne münasebet! Mert panikle saçmalamış olmalı. Bir profesör öğrencisine hırsızlık yaptırır mı? Bu bir iftiradır!',
      },
      {
        q: 'Eski arşivdeki orijinal laboratuvar deney föyleri nerede saklanıyor?',
        a: 'Bütün kayıtlar üniversite merkezi veri tabanında dijitalleşti. Arşivde yalnızca eski ıskarta kağıtlar bulunur.',
      },
    ],
    contradictionEvidenceId: 'kanit_7', // Arşiv Erişim Günlüğü
    contradictionPrompt: 'Gece saat 23.25\'te Profesörün kartıyla arşive giriş yapıldığını kanıtlayan Erişim Günlüğünü masaya koy:',
    contradictionResponse: '“Ne?! Erişim günlüğü mü?.. Bu... Bir dakika, sistemde teknik bir hata olmalı! Ya da... Kartımı Mert\'e vermiş olabilirim... Yani acil numune kontrolü gerekiyordu! Beni böyle bir usulsüzlükle itham edemezsiniz, derhal rektörlüğü arayacağım!”',
    contradictionSuccessText: 'Profesörün "evdeydim" mazereti parçalandı! Gece yarısı delilleri silmek için bizzat arşive girdiği belgelendi.',
  },
];

// Kanıt İlişkilendirme Kuralları
export const RELATION_RULES: RelationRule[] = [
  {
    id: 'rel_1',
    evidenceA: 'kanit_1', // Gizemli Mesaj
    evidenceB: 'kanit_2', // Mavi Anahtar
    title: 'Arşiv Odasının Yeri Çözüldü',
    text: '“Gizemli mesajdaki \'Mavi anahtarın olduğu yere bak\' ifadesi ile çekmecede bulunan anahtar birleşti! Bu anahtar laboratuvarın arka kısmındaki eski kilitli Arşiv Odasını açıyor.”',
    unlockedInfo: 'Eski Arşiv Odasının kilidi açıldı! Artık olay yerinden Arşiv bölümüne geçebilirsiniz.',
  },
  {
    id: 'rel_2',
    evidenceA: 'kanit_5', // Arşiv Notu
    evidenceB: 'kanit_7', // Arşiv Erişim Günlüğü
    title: 'Büyük Veri Sahteciliği Doğrulandı',
    text: '“Arşivdeki el yazısı notta bahsedilen veri manipülasyonu ile Profesör Selim\'in gece 23.25\'teki gizli arşiv girişi örtüşüyor. Profesör, Deniz\'in ifşaatını engellemek için bizzat arşive girerek sahte kayıtları örtbas etmeye çalıştı!”',
    unlockedInfo: 'Profesör Selim\'in suçu doğrudan belgelendi.',
  },
  {
    id: 'rel_3',
    evidenceA: 'kanit_3', // Güvenlik Kaydı
    evidenceB: 'kanit_1', // Gizemli Mesaj
    title: 'Zaman Çakışması Tespit Edildi',
    text: '“Mert\'in 23.08\'de koridora girmesiyle Deniz\'in 23.17\'de panikle acil durum mesajını tetiklemesi arasında doğrudan bir bağ var! Deniz, Mert\'in yaklaştığını fark edip kaçış düğmesine bastı.”',
  },
  {
    id: 'rel_4',
    evidenceA: 'kanit_4', // Silinmiş Mesaj
    evidenceB: 'kanit_6', // Islak Ayak İzleri
    title: 'Deniz\'in Kaçış Rotası Belirlendi',
    text: '“Silinmiş mesajdaki \'Kayıtları saklamalıyız\' ifadesi ve yangın merdivenindeki ıslak ayak izleri, Deniz\'in kaçırılmadığını; orijinal araştırma diskleriyle birlikte yağmur altında kampüsten güvenle kaçtığını ispatlıyor.”',
  },
];

// Zaman Çizelgesi
export const TIMELINE_ITEMS: TimelineItem[] = [
  {
    time: '22.40',
    title: 'Ece ve Deniz\'in Görüşmesi',
    hiddenDesc: 'Koridorda kısa ve gergin bir konuşma gerçekleşti.',
    revealedDesc: 'Ece ve Deniz B Blok koridorunda buluştu. Deniz elindeki verileri Ece\'ye emanet etmek istedi fakat korkup vazgeçti.',
    revealedCondition: (s) => s.collectedEvidence.includes('kanit_4') || s.solvedContradictions.includes('ece'),
  },
  {
    time: '23.00',
    title: 'Mert\'in Şüpheli Alibisi',
    hiddenDesc: 'Mert bu saatte yurtta ders çalıştığını iddia etti.',
    revealedDesc: 'YALAN TESPİT EDİLDİ: Mert yurtta değildi; Profesör Selim\'den aldığı telefonla kampüse doğru yola çıkmıştı.',
    revealedCondition: (s) => s.collectedEvidence.includes('kanit_3') || s.solvedContradictions.includes('mert'),
  },
  {
    time: '23.08',
    title: 'B Blok Koridoruna Giriş',
    hiddenDesc: 'Güvenlik kamerasında belirsiz bir hareketlilik kaydedildi.',
    revealedDesc: 'Güvenlik kamerası B-12 kaydı: Mert Kaya kapüşonunu çekerek laboratuvar koridoruna girdi ve Deniz\'in odasını aradı.',
    revealedCondition: (s) => s.collectedEvidence.includes('kanit_3'),
  },
  {
    time: '23.17',
    title: 'Kritik Son Mesaj Gönderildi',
    hiddenDesc: 'Deniz\'in telefonundan şifreli bir otomatik mesaj gönderildi.',
    revealedDesc: 'Deniz köşeye sıkıştığını anlayıp önceden kurguladığı otomatik mesajı tetikledi: “...Mavi anahtarın olduğu yere bak. Ve lütfen... Ece\'ye inanma.”',
    revealedCondition: (s) => s.collectedEvidence.includes('kanit_1'),
  },
  {
    time: '23.25',
    title: 'Eski Arşiv Kapısı Açıldı',
    hiddenDesc: 'Arşiv kapısındaki manyetik kart okuyucu tetiklendi.',
    revealedDesc: 'Prof. Dr. Selim Er\'in kimlik kartıyla (#88219) Arşiv Odasına giriş yapıldı. Profesör delilleri yok etmeye çalıştı.',
    revealedCondition: (s) => s.collectedEvidence.includes('kanit_7'),
  },
  {
    time: '23.40',
    title: 'Arka Çıkıştan Ayrılış',
    hiddenDesc: 'Yangın merdiveninde dışarıya doğru hareket izleri.',
    revealedDesc: 'Islak ayak izleri: Deniz Arman orijinal araştırma dosyalarını yanına alarak yağmurlu gecede kampüsten güvenle uzaklaştı.',
    revealedCondition: (s) => s.collectedEvidence.includes('kanit_6'),
  },
  {
    time: '00.30',
    title: 'Son Tarih: Adalet ya da Karanlık',
    hiddenDesc: 'Mesajda belirtilen kritik süre sınırı.',
    revealedDesc: 'Deniz\'in orijinal verileri savcılığa teslim etmeden önceki son bekleme süresi. Soruşturmanın kader anı.',
    revealedCondition: () => true,
  },
];

// Basit Web Audio API Ses Sentezleyici (Harici dosya indirmeden atmosfer ve ses efektleri)
class SoundFx {
  private ctx: AudioContext | null = null;
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playTypewriter() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio might be blocked by browser policy
    }
  }

  playSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.06, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {}
  }

  playError() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.25);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  toggleRain(enable: boolean) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      if (!enable) {
        if (this.rainNode) {
          try { this.rainNode.stop(); } catch {}
          this.rainNode.disconnect();
          this.rainNode = null;
        }
        return;
      }

      if (this.rainNode) return; // already playing

      // Pink noise buffer for rain sound
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.02;
        b6 = white * 0.115926;
      }

      this.rainNode = this.ctx.createBufferSource();
      this.rainNode.buffer = buffer;
      this.rainNode.loop = true;

      // Filter for ambient muffled rain
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.rainNode.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);

      this.rainNode.start();
    } catch {}
  }
}

export const sfx = new SoundFx();

// Initial State Generator
export function createInitialState(): GameState {
  let savedBest = 0;
  try {
    const rawBest = localStorage.getItem(BEST_SCORE_KEY);
    if (rawBest) savedBest = parseInt(rawBest, 10) || 0;
  } catch {}

  return {
    screen: 'start',
    activeTab: 'scene',
    score: 0,
    bestScore: savedBest,
    collectedEvidence: [],
    selectedEvidenceForRelation: [],
    discoveredRelations: [],
    solvedContradictions: [],
    askedQuestions: {
      ece: [],
      mert: [],
      profesor: [],
    },
    selectedSuspectId: 'ece',
    archiveUnlocked: false,
    finalEndingId: null,
    logs: ['Soruşturma başlatıldı. Deniz Arman saat 23.17\'de kayboldu.'],
    soundEnabled: false,
  };
}

// Ana Oyun Motoru Sınıfı
export class DetectiveGame {
  private container: HTMLElement;
  private state: GameState;
  private modalContent: { title: string; html: string; onClose?: () => void } | null = null;
  private toastMessage: { text: string; type: 'success' | 'danger' | 'info' } | null = null;
  private toastTimer: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = this.loadGame() || createInitialState();
    this.render();
  }

  private saveGame() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      if (this.state.score > this.state.bestScore) {
        this.state.bestScore = this.state.score;
        localStorage.setItem(BEST_SCORE_KEY, this.state.score.toString());
      }
    } catch {
      // LocalStorage might be disabled or full
    }
  }

  private loadGame(): GameState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Validate integrity
      if (Array.isArray(parsed.collectedEvidence) && typeof parsed.score === 'number') {
        return parsed as GameState;
      }
    } catch {}
    return null;
  }

  public resetGame() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    const best = this.state.bestScore;
    this.state = createInitialState();
    this.state.bestScore = best;
    this.state.screen = 'start';
    this.saveGame();
    this.render();
    this.showToast('Soruşturma sıfırlandı. Yeni vaka hazır.', 'info');
  }

  private showToast(text: string, type: 'success' | 'danger' | 'info' = 'info') {
    this.toastMessage = { text, type };
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.render();
    this.toastTimer = window.setTimeout(() => {
      this.toastMessage = null;
      this.render();
    }, 3800);
  }

  private adjustScore(delta: number, reason: string) {
    const oldScore = this.state.score;
    this.state.score = Math.max(0, this.state.score + delta);
    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    this.state.logs.unshift(`[${sign} Puan] ${reason}`);
    if (delta > 0) {
      if (this.state.soundEnabled) sfx.playSuccess();
      this.showToast(`${sign} Puan: ${reason}`, 'success');
    } else if (delta < 0) {
      if (this.state.soundEnabled) sfx.playError();
      this.showToast(`${sign} Puan: ${reason}`, 'danger');
    }
    this.saveGame();
  }

  // --- OYUN AKSİYONLARI ---

  public startNewGame() {
    this.state.screen = 'intro';
    if (this.state.soundEnabled) sfx.playTypewriter();
    this.render();
  }

  public continueGame() {
    const saved = this.loadGame();
    if (saved) {
      this.state = saved;
      if (this.state.screen === 'start') {
        this.state.screen = 'game';
      }
      if (this.state.soundEnabled) {
        sfx.toggleRain(true);
      }
      this.render();
      this.showToast('Kayıtlı soruşturma başarıyla yüklendi.', 'success');
    } else {
      this.showToast('Henüz kaydedilmiş bir oyun bulunamadı.', 'info');
    }
  }

  public openGameFile() {
    this.state.screen = 'game';
    this.state.activeTab = 'scene';
    if (this.state.soundEnabled) {
      sfx.playTypewriter();
      sfx.toggleRain(true);
    }
    this.saveGame();
    this.render();
  }

  public switchTab(tab: GameState['activeTab']) {
    this.state.activeTab = tab;
    if (this.state.soundEnabled) sfx.playTypewriter();
    this.saveGame();
    this.render();
  }

  public toggleSound() {
    this.state.soundEnabled = !this.state.soundEnabled;
    sfx.toggleRain(this.state.soundEnabled);
    this.saveGame();
    this.render();
    this.showToast(this.state.soundEnabled ? 'Atmosferik sesler açıldı.' : 'Sesler kapatıldı.', 'info');
  }

  // Kanıt İnceleme ve Ekleme
  public inspectEvidence(id: string) {
    const ev = EVIDENCES.find((e) => e.id === id);
    if (!ev) return;
    if (this.state.soundEnabled) sfx.playTypewriter();

    const isAlreadyCollected = this.state.collectedEvidence.includes(id);

    this.modalContent = {
      title: `İnceleme: ${ev.name}`,
      html: `
        <div class="space-y-4">
          <div class="flex items-center gap-3 bg-[#101218]/80 p-3 rounded border border-[#2C3240]">
            <div class="w-10 h-10 rounded bg-[#C9A66B]/20 text-[#C9A66B] flex items-center justify-center font-bold text-lg">
              🔍
            </div>
            <div>
              <p class="text-xs text-[#A7ADBA] uppercase tracking-wider">Konum</p>
              <p class="text-sm font-semibold text-[#E8E8ED]">${ev.location}</p>
            </div>
          </div>

          <div class="p-3 bg-[#101218]/50 rounded border border-[#2C3240]/80">
            <p class="text-xs text-[#A7ADBA] uppercase tracking-wider mb-1">Bulgular ve Açıklama</p>
            <p class="text-sm text-[#E8E8ED] whitespace-pre-line leading-relaxed font-serif-title text-base">${ev.fullDesc}</p>
          </div>

          <div class="p-3 bg-[#C9A66B]/10 rounded border border-[#C9A66B]/30">
            <p class="text-xs text-[#C9A66B] uppercase font-semibold tracking-wider mb-1">Dedektif Çıkarımı</p>
            <p class="text-xs text-[#E8E8ED] leading-relaxed">${ev.intel}</p>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            ${
              isAlreadyCollected
                ? `<span class="inline-flex items-center px-4 py-2 rounded text-xs font-semibold bg-[#86B89A]/20 text-[#86B89A] border border-[#86B89A]/40">
                     ✓ Deftere Zaten Kaydedildi
                   </span>`
                : `<button id="btn-collect-evidence" class="px-5 py-2.5 bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] font-bold rounded shadow transition-all duration-200 cursor-pointer flex items-center gap-2">
                     <span>📁 Kanıt Defterine Ekle (+10 Puan)</span>
                   </button>`
            }
          </div>
        </div>
      `,
    };

    this.render();

    // Event listener for collection
    const collectBtn = document.getElementById('btn-collect-evidence');
    if (collectBtn) {
      collectBtn.onclick = () => {
        this.collectEvidence(id);
        this.closeModal();
      };
    }
  }

  public collectEvidence(id: string) {
    if (this.state.collectedEvidence.includes(id)) {
      this.showToast('Bu kanıt zaten defterinizde kayıtlı.', 'info');
      return;
    }

    this.state.collectedEvidence.push(id);

    // Mavi anahtar arşivi açar
    if (id === 'kanit_2') {
      this.state.archiveUnlocked = true;
      this.showToast('Mavi anahtar bulundu! Eski Arşiv Odasının kilidi açıldı.', 'success');
    }

    this.adjustScore(10, `Yeni Kanıt Bulundu: ${EVIDENCES.find((e) => e.id === id)?.name}`);
    this.render();
  }

  // Kanıt Seçme ve İlişkilendirme
  public toggleSelectEvidenceForRelation(id: string) {
    const idx = this.state.selectedEvidenceForRelation.indexOf(id);
    if (idx > -1) {
      this.state.selectedEvidenceForRelation.splice(idx, 1);
    } else {
      if (this.state.selectedEvidenceForRelation.length >= 2) {
        this.state.selectedEvidenceForRelation.shift(); // keep max 2
      }
      this.state.selectedEvidenceForRelation.push(id);
    }
    if (this.state.soundEnabled) sfx.playTypewriter();
    this.render();
  }

  public combineSelectedEvidence() {
    if (this.state.selectedEvidenceForRelation.length !== 2) {
      this.showToast('Lütfen ilişkilendirmek için tam olarak 2 kanıt seçin.', 'info');
      return;
    }

    const [a, b] = this.state.selectedEvidenceForRelation;

    const matchedRule = RELATION_RULES.find(
      (r) =>
        (r.evidenceA === a && r.evidenceB === b) ||
        (r.evidenceA === b && r.evidenceB === a)
    );

    if (!matchedRule) {
      if (this.state.soundEnabled) sfx.playError();
      this.showToast('Bu iki kanıt arasında doğrudan bir bağ kurulamadı. Başka bağlantıları dene.', 'info');
      return;
    }

    if (this.state.discoveredRelations.includes(matchedRule.id)) {
      this.showToast('Bu bağlantıyı daha önce zaten kurdunuz.', 'info');
      return;
    }

    this.state.discoveredRelations.push(matchedRule.id);

    // If rel_1 discovered (Gizemli mesaj + mavi anahtar), unlock archive
    if (matchedRule.id === 'rel_1') {
      this.state.archiveUnlocked = true;
    }

    this.adjustScore(10, `Doğru Çıkarım: ${matchedRule.title}`);

    this.modalContent = {
      title: `Bağlantı Kuruldu: ${matchedRule.title}`,
      html: `
        <div class="space-y-4">
          <div class="p-4 bg-[#86B89A]/15 border border-[#86B89A]/40 rounded text-sm text-[#E8E8ED] leading-relaxed font-serif-title text-base">
            ${matchedRule.text}
          </div>
          ${
            matchedRule.unlockedInfo
              ? `<div class="p-3 bg-[#C9A66B]/15 border border-[#C9A66B]/40 rounded text-xs text-[#C9A66B] font-semibold">
                  ★ YENİ GELİŞME: ${matchedRule.unlockedInfo}
                 </div>`
              : ''
          }
          <div class="flex justify-end pt-2">
            <button id="btn-close-relation-modal" class="px-4 py-2 bg-[#1C2029] hover:bg-[#2C3240] text-[#E8E8ED] rounded border border-[#2C3240] text-xs font-semibold cursor-pointer">
              Anlaşıldı
            </button>
          </div>
        </div>
      `,
    };

    this.state.selectedEvidenceForRelation = [];
    this.render();

    const closeBtn = document.getElementById('btn-close-relation-modal');
    if (closeBtn) closeBtn.onclick = () => this.closeModal();
  }

  // Sorgu Odası Aksiyonları
  public selectSuspect(id: string) {
    this.state.selectedSuspectId = id;
    if (this.state.soundEnabled) sfx.playTypewriter();
    this.render();
  }

  public askSuspectQuestion(suspectId: string, qIdx: number) {
    if (!this.state.askedQuestions[suspectId]) {
      this.state.askedQuestions[suspectId] = [];
    }
    if (!this.state.askedQuestions[suspectId].includes(qIdx)) {
      this.state.askedQuestions[suspectId].push(qIdx);
    }
    if (this.state.soundEnabled) sfx.playTypewriter();
    this.saveGame();
    this.render();
  }

  public openContradictionModal(suspectId: string) {
    const suspect = SUSPECTS.find((s) => s.id === suspectId);
    if (!suspect) return;

    if (this.state.collectedEvidence.length === 0) {
      this.showToast('Henüz hiç kanıt toplamamışsınız! Önce olay yerini inceleyin.', 'danger');
      return;
    }

    const isAlreadySolved = this.state.solvedContradictions.includes(suspectId);

    const evidenceOptions = this.state.collectedEvidence.map((eid) => {
      const ev = EVIDENCES.find((e) => e.id === eid);
      return `
        <label class="flex items-start gap-3 p-3 rounded bg-[#101218] border border-[#2C3240] hover:border-[#C9A66B]/60 cursor-pointer transition-colors">
          <input type="radio" name="contradiction_evidence" value="${eid}" class="mt-1 accent-[#C9A66B]" />
          <div>
            <p class="text-sm font-semibold text-[#E8E8ED]">${ev?.name}</p>
            <p class="text-xs text-[#A7ADBA] mt-0.5">${ev?.shortDesc}</p>
          </div>
        </label>
      `;
    }).join('');

    this.modalContent = {
      title: `Çelişen Kanıtı Göster: ${suspect.name}`,
      html: `
        <div class="space-y-4">
          <div class="p-3 bg-[#101218]/90 border border-[#2C3240] rounded">
            <p class="text-xs text-[#A7ADBA] uppercase tracking-wider mb-1">Şüphelinin İlk İfadesi</p>
            <p class="text-sm italic text-[#E8E8ED] font-serif-title">${suspect.initialStatement}</p>
          </div>

          <div>
            <p class="text-xs text-[#C9A66B] uppercase font-bold tracking-wider mb-2">
              İfadesiyle doğrudan çelişen kanıtı seçin:
            </p>
            <div class="max-h-64 overflow-y-auto space-y-2 pr-1">
              ${evidenceOptions}
            </div>
          </div>

          <div class="flex justify-between items-center pt-2 border-t border-[#2C3240]">
            <span class="text-[11px] text-[#A7ADBA]">Dikkat: İlgisiz kanıt sunmak -5 ceza puanına yol açar.</span>
            <div class="flex gap-2">
              <button id="btn-cancel-contradiction" class="px-3 py-1.5 rounded bg-[#1C2029] text-[#A7ADBA] hover:text-[#E8E8ED] text-xs font-semibold cursor-pointer">
                Vazgeç
              </button>
              <button id="btn-submit-contradiction" class="px-4 py-1.5 rounded bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] text-xs font-bold cursor-pointer">
                Kanıtı Yüzüne Vur
              </button>
            </div>
          </div>
        </div>
      `,
    };

    this.render();

    const cancelBtn = document.getElementById('btn-cancel-contradiction');
    if (cancelBtn) cancelBtn.onclick = () => this.closeModal();

    const submitBtn = document.getElementById('btn-submit-contradiction');
    if (submitBtn) {
      submitBtn.onclick = () => {
        const selected = document.querySelector('input[name="contradiction_evidence"]:checked') as HTMLInputElement | null;
        if (!selected) {
          this.showToast('Lütfen sunmak için bir kanıt seçin.', 'info');
          return;
        }
        this.submitContradiction(suspectId, selected.value);
      };
    }
  }

  private submitContradiction(suspectId: string, chosenEvidenceId: string) {
    const suspect = SUSPECTS.find((s) => s.id === suspectId);
    if (!suspect) return;

    if (this.state.solvedContradictions.includes(suspectId)) {
      this.closeModal();
      this.showToast(`${suspect.name} zaten bu çelişkiyi itiraf etmişti. Tekrar puan kazanamazsınız.`, 'info');
      return;
    }

    if (chosenEvidenceId === suspect.contradictionEvidenceId) {
      // Doğru kanıt!
      this.state.solvedContradictions.push(suspectId);
      this.adjustScore(15, `İfade Çürütüldü: ${suspect.name} itiraf etti!`);

      this.modalContent = {
        title: `Çelişki Yakalandı: ${suspect.name}`,
        html: `
          <div class="space-y-4">
            <div class="p-3 bg-[#86B89A]/15 border border-[#86B89A]/40 rounded text-xs text-[#86B89A] font-semibold">
              ✓ BAŞARILI TESPİT: ${suspect.contradictionSuccessText}
            </div>

            <div class="p-4 bg-[#101218] border border-[#2C3240] rounded">
              <p class="text-xs text-[#C9A66B] uppercase font-bold tracking-wider mb-2">Şüphelinin Yeni İtirafı</p>
              <p class="text-sm text-[#E8E8ED] leading-relaxed font-serif-title text-base whitespace-pre-line">
                ${suspect.contradictionResponse}
              </p>
            </div>

            <div class="flex justify-end pt-2">
              <button id="btn-close-confession" class="px-5 py-2 bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] font-bold text-xs rounded cursor-pointer">
                Sorguya Devam Et
              </button>
            </div>
          </div>
        `,
      };

      this.render();
      const closeBtn = document.getElementById('btn-close-confession');
      if (closeBtn) closeBtn.onclick = () => this.closeModal();
    } else {
      // Yanlış kanıt sunumu: -5 Puan
      this.closeModal();
      this.adjustScore(-5, `Hatalı Çelişki Sunumu: Bu kanıt ${suspect.name}'nin ifadesiyle doğrudan çelişmiyor.`);
      this.render();
    }
  }

  // Final Kararı ve Sonuç Hesaplama
  public makeVerdict(chosenTarget: 'profesor' | 'mert' | 'ece' | 'yetersiz') {
    if (this.state.collectedEvidence.length < 3) {
      this.showToast('Yeterli kanıt toplamadan nihai karar veremezsiniz! En az 3 kanıt bulun.', 'danger');
      return;
    }

    let endingId: 'A' | 'B' | 'C' | 'D';

    // Şartların Kontrolü
    const hasArchiveNote = this.state.collectedEvidence.includes('kanit_5');
    const hasAccessLog = this.state.collectedEvidence.includes('kanit_7');
    const hasCctv = this.state.collectedEvidence.includes('kanit_3');
    const hasProfContradiction = this.state.solvedContradictions.includes('profesor');
    const hasMertContradiction = this.state.solvedContradictions.includes('mert');

    if (chosenTarget === 'profesor') {
      if (hasArchiveNote && hasAccessLog && hasCctv && hasProfContradiction) {
        endingId = 'A'; // Mükemmel Son: Gerçek Ortaya Çıktı
      } else {
        endingId = 'D'; // Yarım Kalan Gerçek: Erken/Eksik Delille Suçlama
      }
    } else if (chosenTarget === 'mert') {
      endingId = 'B'; // Yanlış Suçlama: Mert sadece bir piyondu
    } else if (chosenTarget === 'ece') {
      endingId = 'C'; // Güven Kırıldı: Ece Deniz'i korumaya çalışıyordu
    } else {
      // yetersiz
      endingId = 'D';
    }

    this.state.finalEndingId = endingId;
    this.state.screen = 'final';

    if (endingId === 'A') {
      this.adjustScore(20, 'Vaka Tam Başarıyla Çözüldü!');
    }

    this.saveGame();
    this.render();
  }

  public giveHint() {
    let hint = '';
    if (!this.state.collectedEvidence.includes('kanit_1')) {
      hint = 'İpucu: Dedektif masasında Deniz\'in telefonu duruyor. Son mesajı inceleyin.';
    } else if (!this.state.collectedEvidence.includes('kanit_2')) {
      hint = 'İpucu: Çekmecede kilitli bir bölme var. Mavi anahtarı bulmanız gerek.';
    } else if (!this.state.archiveUnlocked) {
      hint = 'İpucu: Kanıt Defterinde "Gizemli Mesaj" ile "Mavi Anahtar"ı seçip İlişkilendir butonuna basın.';
    } else if (!this.state.collectedEvidence.includes('kanit_3')) {
      hint = 'İpucu: Koridordaki güvenlik monitörüne bakın. Olay saatinde birileri dolaşıyor muydu?';
    } else if (!this.state.collectedEvidence.includes('kanit_7')) {
      hint = 'İpucu: Açılan Arşiv Odasındaki manyetik kart okuyucu terminalini inceleyin.';
    } else if (!this.state.solvedContradictions.includes('mert')) {
      hint = 'İpucu: Mert "Saat 23.00\'te yurttaydım" dedi. Koridor güvenlik kamerasıyla bu yalanı çürütebilirsiniz.';
    } else if (!this.state.solvedContradictions.includes('profesor')) {
      hint = 'İpucu: Profesör "Kampüse hiç gelmedim" diyor. Arşiv erişim günlüğünü yüzüne vurun.';
    } else {
      hint = 'İpucu: Tüm kritik delilleri topladınız! Kanıt defterindeki ilişkileri kurun ve Final Kararı masasına geçin.';
    }

    this.modalContent = {
      title: 'Dedektif Sezgisi (İpucu)',
      html: `
        <div class="space-y-4">
          <div class="p-4 bg-[#C9A66B]/15 border border-[#C9A66B]/40 rounded text-sm text-[#E8E8ED] leading-relaxed">
            💡 ${hint}
          </div>
          <p class="text-[11px] text-[#A7ADBA]">Gerçek bir dedektif ipuçlarını dikkatle tartar.</p>
          <div class="flex justify-end pt-2">
            <button id="btn-close-hint" class="px-4 py-2 bg-[#C9A66B] text-[#101218] font-bold text-xs rounded cursor-pointer">
              Tamam
            </button>
          </div>
        </div>
      `,
    };

    this.render();
    const closeBtn = document.getElementById('btn-close-hint');
    if (closeBtn) closeBtn.onclick = () => this.closeModal();
  }

  public closeModal() {
    if (this.modalContent?.onClose) {
      this.modalContent.onClose();
    }
    this.modalContent = null;
    this.render();
  }

  public showHowToPlay() {
    this.modalContent = {
      title: 'Nasıl Oynanır? — Dedektiflik El Kitabı',
      html: `
        <div class="space-y-3 text-xs text-[#E8E8ED] leading-relaxed font-sans max-h-96 overflow-y-auto pr-1">
          <div class="p-3 bg-[#101218] border border-[#2C3240] rounded">
            <p class="font-bold text-[#C9A66B] mb-1">1. Olay Yerini İnceleyin</p>
            <p class="text-[#A7ADBA]">Odadaki etkileşimli nesnelere (telefon, çekmece, monitör, ayak izleri, bilgisayar, arşiv) tıklayarak gizli kanıtları açığa çıkarın ve defterinize ekleyin.</p>
          </div>
          <div class="p-3 bg-[#101218] border border-[#2C3240] rounded">
            <p class="font-bold text-[#C9A66B] mb-1">2. Şüphelileri Sorgulayın & Çelişkileri Çürütün</p>
            <p class="text-[#A7ADBA]">3 şüphelinin (Ece, Mert, Prof. Selim) ifadelerini dinleyin. İfadelerindeki bariz yalanları topladığınız kanıtlarla yüzlerine vurun (+15 Puan). Dikkat: Yanlış kanıt sunmak puan kaybettirir (-5 Puan).</p>
          </div>
          <div class="p-3 bg-[#101218] border border-[#2C3240] rounded">
            <p class="font-bold text-[#C9A66B] mb-1">3. Kanıtları İlişkilendirin</p>
            <p class="text-[#A7ADBA]">Kanıt Defterinde 2 kanıt seçip \'İlişkilendir\' diyerek mantıksal sentezler yapın (+10 Puan). Örneğin: Gizemli Mesaj + Mavi Anahtar kilitli Arşiv Odasını açar!</p>
          </div>
          <div class="p-3 bg-[#101218] border border-[#2C3240] rounded">
            <p class="font-bold text-[#C9A66B] mb-1">4. 4 Farklı Son</p>
            <p class="text-[#A7ADBA]">Topladığınız delillere ve sorgu başarılarınıza göre 4 farklı sondan birine ulaşırsınız. Aceleci suçlamalar masumların zarar görmesine veya asıl failin kaçmasına neden olabilir.</p>
          </div>
          <div class="p-3 bg-[#101218] border border-[#2C3240] rounded">
            <p class="font-bold text-[#C9A66B] mb-1">5. Otomatik Kayıt & Süreklilik</p>
            <p class="text-[#A7ADBA]">Oyundaki her adımınız tarayıcınızın hafızasında otomatik saklanır. Sayfayı yenileseniz bile soruşturmanıza kaldığınız yerden devam edebilirsiniz.</p>
          </div>
        </div>
        <div class="flex justify-end pt-3">
          <button id="btn-close-howto" class="px-4 py-2 bg-[#C9A66B] text-[#101218] font-bold text-xs rounded cursor-pointer">
            Anlaşıldı
          </button>
        </div>
      `,
    };
    this.render();
    const closeBtn = document.getElementById('btn-close-howto');
    if (closeBtn) closeBtn.onclick = () => this.closeModal();
  }

  // --- HTML RENDERING ENGINE ---

  public render() {
    let mainHtml = '';

    if (this.state.screen === 'start') {
      mainHtml = this.renderStartScreen();
    } else if (this.state.screen === 'intro') {
      mainHtml = this.renderIntroScreen();
    } else if (this.state.screen === 'final') {
      mainHtml = this.renderFinalScreen();
    } else {
      mainHtml = this.renderMainGameScreen();
    }

    // Modal & Toast wrappers
    const modalHtml = this.modalContent
      ? `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="w-full max-w-lg bg-[#1C2029] border border-[#C9A66B]/50 rounded-lg shadow-2xl p-5 relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A66B] to-transparent"></div>
          <div class="flex items-center justify-between pb-3 border-b border-[#2C3240] mb-4">
            <h3 class="text-base font-bold text-[#C9A66B] font-serif-title tracking-wide">${this.modalContent.title}</h3>
            <button id="btn-modal-x" class="text-[#A7ADBA] hover:text-[#E8E8ED] text-lg font-mono px-2 py-0.5 rounded hover:bg-[#2C3240] cursor-pointer">✕</button>
          </div>
          <div>${this.modalContent.html}</div>
        </div>
      </div>
    `
      : '';

    const toastHtml = this.toastMessage
      ? `
      <div class="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold tracking-wide border ${
        this.toastMessage.type === 'success'
          ? 'bg-[#1C2029] text-[#86B89A] border-[#86B89A]/60'
          : this.toastMessage.type === 'danger'
          ? 'bg-[#1C2029] text-[#D96C6C] border-[#D96C6C]/60'
          : 'bg-[#1C2029] text-[#E8E8ED] border-[#C9A66B]/60'
      } animate-bounce-subtle">
        <span>${this.toastMessage.type === 'success' ? '✓' : this.toastMessage.type === 'danger' ? '⚠' : 'ℹ'}</span>
        <span>${this.toastMessage.text}</span>
      </div>
    `
      : '';

    this.container.innerHTML = `
      <div class="min-h-screen bg-[#101218] text-[#E8E8ED] relative flex flex-col justify-between selection:bg-[#C9A66B]/30">
        ${mainHtml}
        ${modalHtml}
        ${toastHtml}
      </div>
    `;

    this.bindEvents();
  }

  // --- EKRAN ŞABLONLARI ---

  private renderStartScreen(): string {
    const hasSavedGame = this.loadGame() !== null;

    return `
      <div class="relative min-h-screen flex flex-col items-center justify-center p-6 rain-container overflow-hidden">
        <!-- Yağmur damlaları görsel efekt -->
        <div class="absolute inset-0 pointer-events-none opacity-40">
          <div class="rain-drop" style="left: 10%; animation-duration: 0.9s; height: 40px;"></div>
          <div class="rain-drop" style="left: 25%; animation-duration: 1.2s; height: 60px;"></div>
          <div class="rain-drop" style="left: 45%; animation-duration: 0.8s; height: 35px;"></div>
          <div class="rain-drop" style="left: 65%; animation-duration: 1.1s; height: 50px;"></div>
          <div class="rain-drop" style="left: 80%; animation-duration: 1.0s; height: 45px;"></div>
          <div class="rain-drop" style="left: 92%; animation-duration: 1.3s; height: 55px;"></div>
        </div>

        <!-- Noir Masası / Atmosfer Çizimi (SVG) -->
        <div class="w-full max-w-md mb-8 flex justify-center">
          <svg viewBox="0 0 400 180" class="w-full h-auto drop-shadow-2xl">
            <defs>
              <radialGradient id="lampGlow" cx="60%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#C9A66B" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#101218" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2C3240" />
                <stop offset="100%" stop-color="#141720" />
              </linearGradient>
            </defs>
            <!-- Loş ışık hüzmesi -->
            <ellipse cx="220" cy="110" rx="160" ry="60" fill="url(#lampGlow)" />
            <!-- Yağmurlu pencere silueti -->
            <rect x="50" y="20" width="80" height="90" fill="#151922" stroke="#2C3240" stroke-width="2" rx="4" />
            <line x1="90" y1="20" x2="90" y2="110" stroke="#2C3240" stroke-width="2" />
            <line x1="50" y1="65" x2="130" y2="65" stroke="#2C3240" stroke-width="2" />
            <!-- Yağmur çizgileri pencerede -->
            <line x1="65" y1="35" x2="60" y2="50" stroke="#A7ADBA" stroke-width="1" opacity="0.4" />
            <line x1="105" y1="45" x2="100" y2="62" stroke="#A7ADBA" stroke-width="1" opacity="0.4" />
            <line x1="80" y1="75" x2="75" y2="95" stroke="#A7ADBA" stroke-width="1" opacity="0.4" />
            <!-- Masa lambası -->
            <path d="M 280 120 Q 275 80 250 70 L 260 55 L 290 65 L 285 75" fill="none" stroke="#C9A66B" stroke-width="3" />
            <polygon points="245,55 275,65 260,85 235,75" fill="#C9A66B" opacity="0.8" />
            <circle cx="280" cy="122" r="14" fill="#1C2029" stroke="#C9A66B" stroke-width="2" />
            <!-- Dedektif Masası yüzeyi -->
            <rect x="20" y="120" width="360" height="40" fill="url(#deskGrad)" rx="3" />
            <!-- Dosya klasörü & Telefon -->
            <rect x="150" y="125" width="45" height="25" fill="#C9A66B" opacity="0.3" rx="2" transform="rotate(-6 150 125)" />
            <rect x="155" y="127" width="40" height="22" fill="#E8E8ED" opacity="0.2" rx="1" transform="rotate(-6 155 127)" />
            <!-- Akıllı telefon & parlayan ekran (23:17) -->
            <rect x="210" y="128" width="30" height="18" fill="#101218" stroke="#4A90E2" stroke-width="1.5" rx="3" />
            <rect x="213" y="131" width="24" height="12" fill="#4A90E2" opacity="0.4" rx="1" />
            <circle cx="225" cy="137" r="1.5" fill="#E8E8ED" />
          </svg>
        </div>

        <!-- Başlık ve Alt Başlık -->
        <div class="text-center max-w-xl z-10 mb-8">
          <div class="inline-block px-3 py-1 rounded bg-[#C9A66B]/15 border border-[#C9A66B]/30 text-[#C9A66B] font-mono-code text-xs uppercase tracking-widest mb-3">
            KUZGUN ÜNİVERSİTESİ VAKA DOSYASI #2026-B12
          </div>
          <h1 class="text-4xl md:text-5xl font-bold font-serif-title text-[#E8E8ED] tracking-wider mb-2">
            SON MESAJ
          </h1>
          <div class="text-3xl md:text-4xl font-mono-code font-bold text-[#C9A66B] tracking-widest mb-4">
            23.17
          </div>
          <p class="text-sm md:text-base italic text-[#A7ADBA] font-serif-title max-w-md mx-auto leading-relaxed">
            “Bazı mesajlar, gönderildikleri anda değil, çok geç olduğunda anlam kazanır.”
          </p>
        </div>

        <!-- Butonlar -->
        <div class="flex flex-col gap-3 w-full max-w-xs z-10">
          <button id="btn-start-new" class="w-full py-3 px-6 rounded-md bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] font-bold text-sm tracking-wider uppercase transition-all duration-200 shadow-lg hover:shadow-[#C9A66B]/20 cursor-pointer flex items-center justify-center gap-2">
            <span>🔎 Yeni Soruşturma</span>
          </button>

          ${
            hasSavedGame
              ? `<button id="btn-continue" class="w-full py-3 px-6 rounded-md bg-[#1C2029] hover:bg-[#2C3240] text-[#E8E8ED] font-semibold text-sm tracking-wider border border-[#C9A66B]/50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2">
                   <span>📂 Kaldığım Yerden Devam Et (${this.state.score} Puan)</span>
                 </button>`
              : ''
          }

          <button id="btn-how-to-play" class="w-full py-2.5 px-6 rounded-md bg-[#1C2029]/80 hover:bg-[#2C3240] text-[#A7ADBA] hover:text-[#E8E8ED] font-medium text-xs tracking-wider border border-[#2C3240] transition-all duration-200 cursor-pointer">
            📖 Nasıl Oynanır?
          </button>

          <button id="btn-toggle-sound-start" class="w-full py-2 px-6 rounded text-[11px] text-[#A7ADBA] hover:text-[#C9A66B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
            <span>${this.state.soundEnabled ? '🔊 Yağmur ve Sesler: Açık' : '🔇 Yağmur ve Sesler: Kapalı (Tıkla ve Aç)'}</span>
          </button>
        </div>

        <!-- Alt Not -->
        <div class="mt-8 text-center text-[11px] text-[#A7ADBA]/60 font-mono-code z-10">
          <span>Kayıt ve İlerleme Sistemi: Aktif</span>
          ${this.state.bestScore > 0 ? `<span class="mx-2">•</span><span>En İyi Skor: ${this.state.bestScore} Puan</span>` : ''}
        </div>
      </div>
    `;
  }

  private renderIntroScreen(): string {
    return `
      <div class="min-h-screen flex items-center justify-center p-6 bg-[#101218] rain-container">
        <div class="max-w-xl w-full bg-[#1C2029] border border-[#C9A66B]/40 rounded-lg p-6 md:p-8 shadow-2xl relative">
          <div class="flex items-center justify-between border-b border-[#2C3240] pb-3 mb-6">
            <span class="text-xs font-mono-code text-[#C9A66B] uppercase tracking-widest">RESMİ VAKA GİRİŞİ</span>
            <span class="text-xs font-mono-code text-[#A7ADBA]">17 EKİM 2026 — 23.17</span>
          </div>

          <div class="space-y-4 font-serif-title text-base md:text-lg text-[#E8E8ED] leading-relaxed mb-8">
            <p class="first-letter:text-3xl first-letter:font-bold first-letter:text-[#C9A66B] first-letter:mr-1">
              17 Ekim 2026, saat 23.17. Kuzgun Üniversitesi'nde araştırma görevlisi Deniz Arman ortadan kayboldu.
            </p>
            <p class="text-[#A7ADBA]">
              Odasında bir telefon, kilitli bir çekmece ve gönderilmiş tek bir mesaj var. 
              Koridorlar karanlık, pencerelere sonbahar yağmuru çarpıyor ve kampüste derin bir sessizlik hakim.
            </p>
            <div class="p-4 bg-[#101218] border-l-4 border-[#C9A66B] rounded-r text-sm text-[#C9A66B] font-mono-code my-4">
              “Soruşturmayı yürütmek ve Deniz'in izini bulmak için yalnızca 60 dakikan var. 00.30'a kadar gerçekler ortaya çıkmazsa dosyalar sonsuza dek kararacak.”
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-[#2C3240]">
            <button id="btn-back-to-start" class="px-4 py-2 text-xs font-semibold text-[#A7ADBA] hover:text-[#E8E8ED] cursor-pointer">
              ← Başlangıca Dön
            </button>
            <button id="btn-open-case-file" class="px-6 py-3 bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] font-bold text-sm rounded shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-2">
              <span>Dosyayı Aç →</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderMainGameScreen(): string {
    const evidenceCount = this.state.collectedEvidence.length;
    const maxEvidence = EVIDENCES.length;

    // Dedektif Unvanı
    let detectiveRank = 'Stajyer Dedektif';
    if (this.state.score >= 55) detectiveRank = 'Başkomiser';
    else if (this.state.score >= 35) detectiveRank = 'Kıdemli Müfettiş';
    else if (this.state.score >= 20) detectiveRank = 'Dedektif';

    // Vaka Durumu
    let caseStatus = 'Olay Yeri İncelemesi';
    if (this.state.finalEndingId) caseStatus = 'Karar Verildi';
    else if (this.state.solvedContradictions.length >= 2) caseStatus = 'Kritik Çelişkiler Çözüldü';
    else if (this.state.archiveUnlocked) caseStatus = 'Arşiv Kilidi Açıldı';
    else if (evidenceCount > 0) caseStatus = 'Kanıtlar Toplanıyor';

    return `
      <!-- Üst Bilgi Çubuğu (Top Bar) -->
      <header class="bg-[#1C2029] border-b border-[#2C3240] px-4 py-3 sticky top-0 z-30 shadow-md">
        <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <!-- Sol: Logo ve Vaka Bilgisi -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded bg-[#C9A66B]/20 border border-[#C9A66B]/50 flex items-center justify-center font-bold text-[#C9A66B] text-sm">
              23:17
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold tracking-wide text-[#E8E8ED]">SON MESAJ: 23.17</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-[#101218] text-[#C9A66B] border border-[#C9A66B]/30 font-mono-code">
                  ${caseStatus}
                </span>
              </div>
              <p class="text-xs text-[#A7ADBA]">Deniz Arman Kayıp Vakası • Süreç: 23:17 → 00:30</p>
            </div>
          </div>

          <!-- Sağ: İstatistikler ve Aksiyon Butonları -->
          <div class="flex items-center gap-4 text-xs font-mono-code">
            <div class="bg-[#101218] px-3 py-1.5 rounded border border-[#2C3240] flex items-center gap-2">
              <span class="text-[#A7ADBA]">Kanıtlar:</span>
              <span class="font-bold text-[#C9A66B]">${evidenceCount} / ${maxEvidence}</span>
            </div>

            <div class="bg-[#101218] px-3 py-1.5 rounded border border-[#2C3240] flex items-center gap-2">
              <span class="text-[#A7ADBA]">Puan:</span>
              <span class="font-bold text-[#86B89A]">${this.state.score}</span>
            </div>

            <div class="hidden sm:flex bg-[#101218] px-3 py-1.5 rounded border border-[#2C3240] items-center gap-1.5 text-[#E8E8ED]">
              <span>🕵️</span>
              <span>${detectiveRank}</span>
            </div>

            <div class="flex items-center gap-1.5">
              <button id="btn-get-hint" title="Dedektif İpucu Al" class="px-2.5 py-1.5 bg-[#101218] hover:bg-[#2C3240] text-[#C9A66B] rounded border border-[#C9A66B]/40 cursor-pointer text-xs font-bold transition-colors">
                💡 İpucu
              </button>

              <button id="btn-toggle-sound-top" title="Ses Aç/Kapat" class="px-2.5 py-1.5 bg-[#101218] hover:bg-[#2C3240] text-[#A7ADBA] rounded border border-[#2C3240] cursor-pointer text-xs">
                ${this.state.soundEnabled ? '🔊' : '🔇'}
              </button>

              <button id="btn-restart-game" title="Soruşturmayı Sıfırla" class="px-2 py-1.5 bg-[#101218] hover:bg-[#D96C6C]/20 text-[#A7ADBA] hover:text-[#D96C6C] rounded border border-[#2C3240] cursor-pointer text-xs">
                🔄
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Ana Sekmeler (Tabs) -->
      <nav class="bg-[#141720] border-b border-[#2C3240] px-4 sticky top-[57px] z-20">
        <div class="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          ${this.renderTabBtn('scene', '🔍 Olay Yeri', 'bg-amber')}
          ${this.renderTabBtn('evidence', `📁 Kanıt Defteri (${evidenceCount})`)}
          ${this.renderTabBtn('suspects', '👥 Şüpheliler (3)')}
          ${this.renderTabBtn('interrogation', `🗣️ Sorgu Odası ${this.state.solvedContradictions.length ? `(${this.state.solvedContradictions.length}/3)` : ''}`)}
          ${this.renderTabBtn('timeline', '⏳ Zaman Çizelgesi')}
          ${this.renderTabBtn('verdict', '⚖️ Final Kararı', 'text-amber')}
        </div>
      </nav>

      <!-- Sekme İçeriği -->
      <main class="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-16">
        ${this.renderActiveTabContent()}
      </main>

      <!-- Alt Bar / Durum ve Hızlı Bilgi -->
      <footer class="bg-[#141720] border-t border-[#2C3240] px-4 py-2 text-xs text-[#A7ADBA]">
        <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 truncate max-w-md">
            <span class="text-[#C9A66B]">Son Gelişme:</span>
            <span class="text-[#E8E8ED] truncate">${this.state.logs[0] || 'Soruşturma sürüyor...'}</span>
          </div>
          <div class="flex items-center gap-3 text-[11px] font-mono-code">
            <span>Arşiv Durumu: ${this.state.archiveUnlocked ? '<strong class="text-[#86B89A]">AÇIK</strong>' : '<strong class="text-[#D96C6C]">KİLİTLİ</strong>'}</span>
            <span>•</span>
            <button id="btn-footer-howto" class="text-[#C9A66B] hover:underline cursor-pointer">Nasıl Oynanır?</button>
          </div>
        </div>
      </footer>
    `;
  }

  private renderTabBtn(tabKey: GameState['activeTab'], label: string, extra = ''): string {
    const isActive = this.state.activeTab === tabKey;
    return `
      <button 
        data-tab="${tabKey}" 
        class="tab-btn px-4 py-2 rounded text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-[#C9A66B] text-[#101218] font-bold shadow'
            : 'text-[#A7ADBA] hover:text-[#E8E8ED] hover:bg-[#1C2029]'
        } ${extra}">
        ${label}
      </button>
    `;
  }

  private renderActiveTabContent(): string {
    switch (this.state.activeTab) {
      case 'scene':
        return this.renderSceneTab();
      case 'evidence':
        return this.renderEvidenceTab();
      case 'suspects':
        return this.renderSuspectsTab();
      case 'interrogation':
        return this.renderInterrogationTab();
      case 'timeline':
        return this.renderTimelineTab();
      case 'verdict':
        return this.renderVerdictTab();
      default:
        return '';
    }
  }

  // --- 1. OLAY YERİ SEKMESİ (2D Sahne) ---
  private renderSceneTab(): string {
    const isPhoneCollected = this.state.collectedEvidence.includes('kanit_1');
    const isKeyCollected = this.state.collectedEvidence.includes('kanit_2');
    const isCctvCollected = this.state.collectedEvidence.includes('kanit_3');
    const isMsgCollected = this.state.collectedEvidence.includes('kanit_4');
    const isNoteCollected = this.state.collectedEvidence.includes('kanit_5');
    const isPrintsCollected = this.state.collectedEvidence.includes('kanit_6');
    const isLogCollected = this.state.collectedEvidence.includes('kanit_7');

    return `
      <div class="space-y-6">
        <!-- Başlık & Açıklama -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C3240] pb-3">
          <div>
            <h2 class="text-xl font-bold font-serif-title text-[#E8E8ED]">Deniz Arman'ın Laboratuvar Odası</h2>
            <p class="text-xs text-[#A7ADBA]">B Blok 3. Kat — Tıklanabilir nesneleri inceleyerek kanıt toplayın.</p>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="inline-block w-2.5 h-2.5 rounded-full ${this.state.archiveUnlocked ? 'bg-[#86B89A]' : 'bg-[#D96C6C]'} animate-pulse"></span>
            <span class="text-[#A7ADBA]">Arşiv Odası: ${this.state.archiveUnlocked ? 'Açık' : 'Kilitli (Mavi anahtar gerekli)'}</span>
          </div>
        </div>

        <!-- 2D Etkileşimli Sahne Görünümü (SVG & CSS Tabanlı Noir Mekan) -->
        <div class="relative bg-[#161A23] rounded-lg border border-[#2C3240] p-4 shadow-xl overflow-hidden min-h-[380px] flex flex-col justify-between scanline">
          <!-- Olay Yeri Duvar & Zemin Çizgisi -->
          <div class="absolute inset-x-0 bottom-24 h-1 bg-[#2C3240]/60 pointer-events-none"></div>

          <!-- Nesneler Grid / Yerleşimi -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 z-10 relative">
            
            <!-- 1. TELEFON -->
            <button data-inspect="kanit_1" class="scene-item group text-left p-4 rounded-lg bg-[#1C2029]/90 hover:bg-[#252B38] border ${isPhoneCollected ? 'border-[#86B89A]/50' : 'border-[#C9A66B]/60 hover:border-[#C9A66B]'} transition-all duration-200 cursor-pointer shadow-md hover:-translate-y-0.5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-2xl">📱</span>
                <span class="text-[10px] px-2 py-0.5 rounded font-mono-code ${isPhoneCollected ? 'bg-[#86B89A]/20 text-[#86B89A]' : 'bg-[#C9A66B]/20 text-[#C9A66B]'}">
                  ${isPhoneCollected ? '✓ İncelendi' : '★ İNCELE'}
                </span>
              </div>
              <h3 class="text-sm font-bold text-[#E8E8ED] group-hover:text-[#C9A66B] transition-colors font-serif-title">Deniz'in Telefonu</h3>
              <p class="text-xs text-[#A7ADBA] mt-1 line-clamp-2">Masada ekranı açık duran akıllı telefon. 23.17'de gönderilen son mesaj ekranda parlıyor.</p>
            </button>

            <!-- 2. KİLİTLİ ÇEKMECE (Mavi Anahtar) -->
            <button data-inspect="kanit_2" class="scene-item group text-left p-4 rounded-lg bg-[#1C2029]/90 hover:bg-[#252B38] border ${isKeyCollected ? 'border-[#86B89A]/50' : 'border-[#C9A66B]/60 hover:border-[#C9A66B]'} transition-all duration-200 cursor-pointer shadow-md hover:-translate-y-0.5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-2xl">🗝️</span>
                <span class="text-[10px] px-2 py-0.5 rounded font-mono-code ${isKeyCollected ? 'bg-[#86B89A]/20 text-[#86B89A]' : 'bg-[#C9A66B]/20 text-[#C9A66B]'}">
                  ${isKeyCollected ? '✓ İncelendi' : '★ İNCELE'}
                </span>
              </div>
              <h3 class="text-sm font-bold text-[#E8E8ED] group-hover:text-[#C9A66B] transition-colors font-serif-title">Masa Çekmecesi</h3>
              <p class="text-xs text-[#A7ADBA] mt-1 line-clamp-2">Kısmen aralık bırakılmış çekmece. Gizli bölmesinde mavi boyalı bir anahtar var.</p>
            </button>

            <!-- 3. GÜVENLİK MONİTÖRÜ (Güvenlik Kaydı) -->
            <button data-inspect="kanit_3" class="scene-item group text-left p-4 rounded-lg bg-[#1C2029]/90 hover:bg-[#252B38] border ${isCctvCollected ? 'border-[#86B89A]/50' : 'border-[#C9A66B]/60 hover:border-[#C9A66B]'} transition-all duration-200 cursor-pointer shadow-md hover:-translate-y-0.5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-2xl">📹</span>
                <span class="text-[10px] px-2 py-0.5 rounded font-mono-code ${isCctvCollected ? 'bg-[#86B89A]/20 text-[#86B89A]' : 'bg-[#C9A66B]/20 text-[#C9A66B]'}">
                  ${isCctvCollected ? '✓ İncelendi' : '★ İNCELE'}
                </span>
              </div>
              <h3 class="text-sm font-bold text-[#E8E8ED] group-hover:text-[#C9A66B] transition-colors font-serif-title">Güvenlik Kamerası</h3>
              <p class="text-xs text-[#A7ADBA] mt-1 line-clamp-2">Koridor kamera kaydı. Saat 23.08'de şüpheli bir kişinin içeri girişini gösteriyor.</p>
            </button>

            <!-- 4. ÇALIŞMA BİLGİSAYARI (Silinmiş Mesaj) -->
            <button data-inspect="kanit_4" class="scene-item group text-left p-4 rounded-lg bg-[#1C2029]/90 hover:bg-[#252B38] border ${isMsgCollected ? 'border-[#86B89A]/50' : 'border-[#C9A66B]/60 hover:border-[#C9A66B]'} transition-all duration-200 cursor-pointer shadow-md hover:-translate-y-0.5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-2xl">💻</span>
                <span class="text-[10px] px-2 py-0.5 rounded font-mono-code ${isMsgCollected ? 'bg-[#86B89A]/20 text-[#86B89A]' : 'bg-[#C9A66B]/20 text-[#C9A66B]'}">
                  ${isMsgCollected ? '✓ İncelendi' : '★ İNCELE'}
                </span>
              </div>
              <h3 class="text-sm font-bold text-[#E8E8ED] group-hover:text-[#C9A66B] transition-colors font-serif-title">Bilgisayar Terminali</h3>
              <p class="text-xs text-[#A7ADBA] mt-1 line-clamp-2">Açık kalan bulut yedekleme arayüzü. Ece ile silinmiş WhatsApp mesajlaşması tespit edildi.</p>
            </button>

            <!-- 5. ISLAK AYAK İZLERİ -->
            <button data-inspect="kanit_6" class="scene-item group text-left p-4 rounded-lg bg-[#1C2029]/90 hover:bg-[#252B38] border ${isPrintsCollected ? 'border-[#86B89A]/50' : 'border-[#C9A66B]/60 hover:border-[#C9A66B]'} transition-all duration-200 cursor-pointer shadow-md hover:-translate-y-0.5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-2xl">👣</span>
                <span class="text-[10px] px-2 py-0.5 rounded font-mono-code ${isPrintsCollected ? 'bg-[#86B89A]/20 text-[#86B89A]' : 'bg-[#C9A66B]/20 text-[#C9A66B]'}">
                  ${isPrintsCollected ? '✓ İncelendi' : '★ İNCELE'}
                </span>
              </div>
              <h3 class="text-sm font-bold text-[#E8E8ED] group-hover:text-[#C9A66B] transition-colors font-serif-title">Islak Ayak İzleri</h3>
              <p class="text-xs text-[#A7ADBA] mt-1 line-clamp-2">Koridordan yangın çıkışına ve dış kapıya yönelen çamurlu ayakkabı izleri.</p>
            </button>

            <!-- 6. KİLİTLİ / AÇIK ESKİ ARŞİV BÖLÜMÜ -->
            <div class="col-span-2 sm:col-span-3 lg:col-span-3 p-4 rounded-lg border ${
              this.state.archiveUnlocked
                ? 'bg-[#1C2029]/95 border-[#86B89A]/50'
                : 'bg-[#151820]/90 border-[#D96C6C]/40'
            } transition-all">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">${this.state.archiveUnlocked ? '🚪' : '🔒'}</span>
                  <div>
                    <h3 class="text-sm font-bold text-[#E8E8ED] font-serif-title">Eski Araştırma Arşiv Odası</h3>
                    <p class="text-[11px] text-[#A7ADBA]">
                      ${
                        this.state.archiveUnlocked
                          ? 'Mavi anahtarla kilit açıldı. Gizli arşiv dosyaları erişilebilir.'
                          : 'KİLİTLİ: Kapıda ağır asma kilit var. Açmak için Mavi Anahtar ve Gizemli Mesaj ilişkisi gereklidir.'
                      }
                    </p>
                  </div>
                </div>
                ${
                  !this.state.archiveUnlocked
                    ? `<span class="px-2.5 py-1 rounded bg-[#D96C6C]/15 text-[#D96C6C] text-[10px] font-mono-code border border-[#D96C6C]/30">KİLİTLİ ALAN</span>`
                    : `<span class="px-2.5 py-1 rounded bg-[#86B89A]/15 text-[#86B89A] text-[10px] font-mono-code border border-[#86B89A]/30">ERİŞİME AÇIK</span>`
                }
              </div>

              ${
                this.state.archiveUnlocked
                  ? `
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#2C3240]">
                    <!-- Arşiv Notu -->
                    <button data-inspect="kanit_5" class="scene-item text-left p-3 rounded bg-[#101218] hover:bg-[#202533] border ${isNoteCollected ? 'border-[#86B89A]/50' : 'border-[#C9A66B]/60'} cursor-pointer transition-colors">
                      <div class="flex items-center justify-between">
                        <span class="text-lg">📄</span>
                        <span class="text-[9px] font-mono-code text-[#C9A66B]">${isNoteCollected ? '✓ Defterde' : '★ İNCELE'}</span>
                      </div>
                      <p class="text-xs font-bold text-[#E8E8ED] mt-1 font-serif-title">Arşiv Notu (Veri Sahteciliği)</p>
                      <p class="text-[11px] text-[#A7ADBA]">Orijinal sonuçlar ile yayımlanan raporun uyuşmadığını yazan el notu.</p>
                    </button>

                    <!-- Arşiv Erişim Günlüğü -->
                    <button data-inspect="kanit_7" class="scene-item text-left p-3 rounded bg-[#101218] hover:bg-[#202533] border ${isLogCollected ? 'border-[#86B89A]/50' : 'border-[#C9A66B]/60'} cursor-pointer transition-colors">
                      <div class="flex items-center justify-between">
                        <span class="text-lg">💳</span>
                        <span class="text-[9px] font-mono-code text-[#C9A66B]">${isLogCollected ? '✓ Defterde' : '★ İNCELE'}</span>
                      </div>
                      <p class="text-xs font-bold text-[#E8E8ED] mt-1 font-serif-title">Arşiv Erişim Günlüğü</p>
                      <p class="text-[11px] text-[#A7ADBA]">Gece 23.25'te Profesör Selim'in kartıyla giriş yapıldığını gösteren kayıt.</p>
                    </button>
                  </div>
                `
                  : `
                  <div class="p-3 bg-[#101218]/60 rounded text-center text-xs text-[#A7ADBA]">
                    Bu kapı kilitli. Masadaki mavi anahtarı bulun veya Gizemli Mesaj ile Mavi Anahtar'ı Kanıt Defterinde ilişkilendirin.
                  </div>
                `
              }
            </div>

          </div>
        </div>
      </div>
    `;
  }

  // --- 2. KANIT DEFTERİ SEKMESİ ---
  private renderEvidenceTab(): string {
    const collectedEvs = EVIDENCES.filter((e) => this.state.collectedEvidence.includes(e.id));
    const selectedCount = this.state.selectedEvidenceForRelation.length;

    return `
      <div class="space-y-6">
        <!-- Başlık & İlişkilendirme Butonu -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2C3240] pb-3">
          <div>
            <h2 class="text-xl font-bold font-serif-title text-[#E8E8ED]">Dedektif Kanıt Defteri</h2>
            <p class="text-xs text-[#A7ADBA]">
              Toplanan Kanıtlar: ${collectedEvs.length} / ${EVIDENCES.length} • İki kanıt seçerek sentez yapın ve yeni sırlar açığa çıkarın.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button 
              id="btn-combine-evidence" 
              class="px-4 py-2 rounded text-xs font-bold transition-all duration-200 cursor-pointer ${
                selectedCount === 2
                  ? 'bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] shadow-md'
                  : 'bg-[#2C3240] text-[#A7ADBA] opacity-60 cursor-not-allowed'
              }">
              🔗 İki Kanıtı İlişkilendir (${selectedCount}/2)
            </button>
          </div>
        </div>

        <!-- Bulunmuş Bağlantılar / Keşfedilen İpuçları Paneli -->
        ${
          this.state.discoveredRelations.length > 0
            ? `
            <div class="p-4 rounded-lg bg-[#86B89A]/10 border border-[#86B89A]/30 space-y-2">
              <p class="text-xs font-bold text-[#86B89A] uppercase tracking-wider">
                ✓ Doğrulanmış Dedektif Bağlantıları (${this.state.discoveredRelations.length}):
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                ${this.state.discoveredRelations.map((rid) => {
                  const rule = RELATION_RULES.find((r) => r.id === rid);
                  return `
                    <div class="p-2.5 bg-[#101218] rounded border border-[#2C3240] text-xs">
                      <p class="font-bold text-[#E8E8ED]">${rule?.title}</p>
                      <p class="text-[#A7ADBA] text-[11px] mt-0.5 line-clamp-2">${rule?.text}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `
            : ''
        }

        <!-- Kanıt Listesi -->
        ${
          collectedEvs.length === 0
            ? `
            <div class="p-8 text-center bg-[#1C2029] rounded-lg border border-[#2C3240] space-y-3">
              <span class="text-4xl">📁</span>
              <p class="text-base font-bold text-[#E8E8ED] font-serif-title">Defteriniz Henüz Boş</p>
              <p class="text-xs text-[#A7ADBA] max-w-sm mx-auto">
                Olay Yerine dönerek Deniz'in telefonunu, çekmecesini ve güvenlik monitörünü inceleyin ve kanıtları toplayın.
              </p>
            </div>
          `
            : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${collectedEvs.map((ev) => {
                const isSelected = this.state.selectedEvidenceForRelation.includes(ev.id);
                return `
                  <div class="p-4 rounded-lg bg-[#1C2029] border transition-all ${
                    isSelected
                      ? 'border-[#C9A66B] ring-2 ring-[#C9A66B]/30 bg-[#252B38]'
                      : 'border-[#2C3240] hover:border-[#C9A66B]/50'
                  }">
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <div class="flex items-center gap-2">
                        <span class="text-xl">📋</span>
                        <div>
                          <h3 class="text-sm font-bold text-[#E8E8ED] font-serif-title">${ev.name}</h3>
                          <p class="text-[10px] text-[#A7ADBA]">${ev.location}</p>
                        </div>
                      </div>
                      <button 
                        data-select-relation="${ev.id}" 
                        class="px-2.5 py-1 rounded text-[11px] font-mono-code transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#C9A66B] text-[#101218] font-bold'
                            : 'bg-[#101218] text-[#A7ADBA] hover:text-[#E8E8ED] border border-[#2C3240]'
                        }">
                        ${isSelected ? '✓ Seçildi' : '+ Seç'}
                      </button>
                    </div>

                    <p class="text-xs text-[#E8E8ED] mt-2 leading-relaxed bg-[#101218]/50 p-2.5 rounded border border-[#2C3240]/60 font-serif-title text-sm whitespace-pre-line">
                      ${ev.fullDesc}
                    </p>

                    <div class="mt-3 pt-2 border-t border-[#2C3240]/80 flex flex-wrap items-center justify-between text-[11px] gap-2">
                      <span class="text-[#C9A66B] font-medium">İlgili Kişiler: ${ev.suspects.join(', ')}</span>
                      <button data-inspect="${ev.id}" class="text-[#A7ADBA] hover:text-[#E8E8ED] underline cursor-pointer">
                        Detaylı İncele →
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `
        }
      </div>
    `;
  }

  // --- 3. ŞÜPHELİLER SEKMESİ ---
  private renderSuspectsTab(): string {
    return `
      <div class="space-y-6">
        <div class="border-b border-[#2C3240] pb-3">
          <h2 class="text-xl font-bold font-serif-title text-[#E8E8ED]">Vaka Şüphelileri</h2>
          <p class="text-xs text-[#A7ADBA]">
            Deniz Arman'ın kayboluşuyla doğrudan bağlantılı üç kilit şahıs. Hiçbirini sadece ilk ifadesine göre peşinen suçlu ilan etmeyin.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${SUSPECTS.map((suspect) => {
            const isContradictionSolved = this.state.solvedContradictions.includes(suspect.id);
            const askedCount = (this.state.askedQuestions[suspect.id] || []).length;

            return `
              <div class="p-5 rounded-lg bg-[#1C2029] border ${isContradictionSolved ? 'border-[#86B89A]/50' : 'border-[#2C3240]'} flex flex-col justify-between shadow-lg">
                <div>
                  <!-- Avatar & İsim -->
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-inner" style="background-color: ${suspect.avatarColor}">
                      ${suspect.name.charAt(0)}
                    </div>
                    <div>
                      <h3 class="text-base font-bold text-[#E8E8ED] font-serif-title">${suspect.name}</h3>
                      <p class="text-xs text-[#C9A66B]">${suspect.role}</p>
                    </div>
                  </div>

                  <!-- Durum Rozeti -->
                  <div class="mb-3">
                    ${
                      isContradictionSolved
                        ? `<span class="inline-block px-2 py-0.5 rounded bg-[#86B89A]/15 border border-[#86B89A]/40 text-[#86B89A] text-[10px] font-mono-code font-semibold">
                             ✓ ÇELİŞKİ İTİRAF EDİLDİ
                           </span>`
                        : `<span class="inline-block px-2 py-0.5 rounded bg-[#D96C6C]/15 border border-[#D96C6C]/40 text-[#D96C6C] text-[10px] font-mono-code font-semibold">
                             ŞÜPHELİ KONUMUNDA
                           </span>`
                    }
                  </div>

                  <!-- Resmi İfade -->
                  <div class="p-3 bg-[#101218] rounded border border-[#2C3240] mb-4 text-xs italic text-[#A7ADBA] font-serif-title text-sm leading-relaxed">
                    ${suspect.initialStatement}
                  </div>
                </div>

                <div class="pt-3 border-t border-[#2C3240] flex items-center justify-between">
                  <span class="text-[11px] text-[#A7ADBA] font-mono-code">Sorular: ${askedCount}/3</span>
                  <button 
                    data-go-interrogate="${suspect.id}" 
                    class="px-3.5 py-1.5 rounded bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] text-xs font-bold transition-colors cursor-pointer">
                    Sorguya Al →
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // --- 4. SORGU ODASI SEKMESİ ---
  private renderInterrogationTab(): string {
    const suspect = SUSPECTS.find((s) => s.id === this.state.selectedSuspectId) || SUSPECTS[0];
    const isSolved = this.state.solvedContradictions.includes(suspect.id);
    const askedIndices = this.state.askedQuestions[suspect.id] || [];

    return `
      <div class="space-y-6">
        <!-- Şüpheli Seçim Butonları -->
        <div class="flex items-center gap-2 border-b border-[#2C3240] pb-3 overflow-x-auto scrollbar-none">
          <span class="text-xs font-mono-code text-[#A7ADBA] mr-2">Şüpheliyi Seç:</span>
          ${SUSPECTS.map((s) => {
            const isCurrent = s.id === suspect.id;
            const solved = this.state.solvedContradictions.includes(s.id);
            return `
              <button 
                data-select-suspect="${s.id}" 
                class="px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#C9A66B] text-[#101218] font-bold shadow'
                    : 'bg-[#1C2029] text-[#A7ADBA] hover:text-[#E8E8ED] border border-[#2C3240]'
                }">
                ${s.name} ${solved ? '✓' : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Sorgu Masası Paneli -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Sol: Şüpheli Profili & İlk İfade -->
          <div class="p-5 rounded-lg bg-[#1C2029] border border-[#2C3240] flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center gap-3 pb-3 border-b border-[#2C3240]">
                <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white" style="background-color: ${suspect.avatarColor}">
                  ${suspect.name.charAt(0)}
                </div>
                <div>
                  <h3 class="text-base font-bold text-[#E8E8ED] font-serif-title">${suspect.name}</h3>
                  <p class="text-xs text-[#C9A66B]">${suspect.role}</p>
                </div>
              </div>

              <div class="mt-4">
                <p class="text-xs uppercase font-bold text-[#A7ADBA] tracking-wider mb-1">İlk İfadesi</p>
                <div class="p-3 bg-[#101218] rounded border border-[#2C3240] text-xs italic text-[#E8E8ED] font-serif-title text-sm leading-relaxed">
                  ${suspect.initialStatement}
                </div>
              </div>

              <!-- İtiraf Durumu -->
              ${
                isSolved
                  ? `
                  <div class="mt-4 p-3 rounded bg-[#86B89A]/15 border border-[#86B89A]/40 text-xs text-[#86B89A]">
                    <p class="font-bold mb-1">✓ ÇELİŞKİ İTİRAFI ALINDI</p>
                    <p class="text-[11px] text-[#E8E8ED] leading-relaxed font-serif-title">${suspect.contradictionResponse}</p>
                  </div>
                `
                  : `
                  <div class="mt-4 p-3 rounded bg-[#D96C6C]/10 border border-[#D96C6C]/30 text-xs text-[#D96C6C]">
                    <p class="font-bold">Henüz Çelişki İtirafı Alınmadı</p>
                    <p class="text-[11px] text-[#A7ADBA] mt-0.5">Topladığınız kanıtlarla ifadesindeki yalanı yakalayın.</p>
                  </div>
                `
              }
            </div>

            <!-- Çelişen Kanıtı Göster Butonu -->
            <button 
              id="btn-open-contradiction" 
              class="w-full py-2.5 px-4 rounded bg-[#D96C6C] hover:bg-[#e47a7a] text-white font-bold text-xs tracking-wider uppercase transition-colors shadow cursor-pointer">
              ⚡ İfadesiyle Çelişen Kanıtı Göster (+15 Puan)
            </button>
          </div>

          <!-- Sağ: Sorgu Soruları & Yanıtlar -->
          <div class="lg:col-span-2 p-5 rounded-lg bg-[#1C2029] border border-[#2C3240] space-y-4">
            <div class="flex items-center justify-between border-b border-[#2C3240] pb-2">
              <h3 class="text-sm font-bold text-[#C9A66B] uppercase tracking-wider font-mono-code">Sorgu Soruları</h3>
              <span class="text-xs text-[#A7ADBA]">Şüpheliye soru sorarak yeni ipuçları toplayın.</span>
            </div>

            <div class="space-y-3">
              ${suspect.questions.map((qObj, idx) => {
                const isAsked = askedIndices.includes(idx);
                return `
                  <div class="p-3.5 rounded-lg bg-[#101218] border border-[#2C3240] space-y-2">
                    <div class="flex items-start justify-between gap-3">
                      <p class="text-xs font-bold text-[#E8E8ED] font-serif-title text-sm">
                        “${qObj.q}”
                      </p>
                      <button 
                        data-ask-q="${idx}" 
                        class="px-3 py-1 rounded text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                          isAsked
                            ? 'bg-[#2C3240] text-[#A7ADBA]'
                            : 'bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] font-bold'
                        }">
                        ${isAsked ? 'Tekrar Sor' : 'Soruyu Sor'}
                      </button>
                    </div>

                    ${
                      isAsked
                        ? `
                        <div class="pt-2 border-t border-[#2C3240]/60 text-xs text-[#C9A66B] font-serif-title text-sm leading-relaxed flex gap-2">
                          <span>↳</span>
                          <span class="text-[#E8E8ED] italic">${qObj.a}</span>
                        </div>
                      `
                        : ''
                    }
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // --- 5. ZAMAN ÇİZELGESİ SEKMESİ ---
  private renderTimelineTab(): string {
    return `
      <div class="space-y-6">
        <div class="border-b border-[#2C3240] pb-3">
          <h2 class="text-xl font-bold font-serif-title text-[#E8E8ED]">Olay Gecesi Zaman Çizelgesi</h2>
          <p class="text-xs text-[#A7ADBA]">
            17 Ekim 2026 gecesi 22.40 ile 00.30 arasındaki kritik saatler. Kanıtlar toplandıkça gizli düğümler aydınlanır.
          </p>
        </div>

        <div class="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2C3240]">
          ${TIMELINE_ITEMS.map((item) => {
            const isRevealed = item.revealedCondition(this.state);
            return `
              <div class="relative group">
                <!-- Nokta / Pin -->
                <div class="absolute -left-[29px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  isRevealed
                    ? 'bg-[#C9A66B] border-[#101218] shadow-md shadow-[#C9A66B]/30'
                    : 'bg-[#2C3240] border-[#101218]'
                }"></div>

                <!-- Kart -->
                <div class="p-4 rounded-lg bg-[#1C2029] border ${isRevealed ? 'border-[#C9A66B]/40' : 'border-[#2C3240]'} space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono-code font-bold ${isRevealed ? 'text-[#C9A66B]' : 'text-[#A7ADBA]'}">
                      Saat ${item.time}
                    </span>
                    <span class="text-xs font-bold text-[#E8E8ED] font-serif-title">
                      — ${item.title}
                    </span>
                  </div>

                  <p class="text-xs leading-relaxed ${isRevealed ? 'text-[#E8E8ED]' : 'text-[#A7ADBA]/60 italic font-serif-title'}">
                    ${isRevealed ? item.revealedDesc : `[BİLİNMİYOR] ${item.hiddenDesc}`}
                  </p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // --- 6. FİNAL KARARI SEKMESİ ---
  private renderVerdictTab(): string {
    const collectedCount = this.state.collectedEvidence.length;
    const solvedCount = this.state.solvedContradictions.length;

    return `
      <div class="space-y-6">
        <div class="border-b border-[#2C3240] pb-3">
          <h2 class="text-xl font-bold font-serif-title text-[#E8E8ED]">Final Kararı Masası</h2>
          <p class="text-xs text-[#A7ADBA]">
            Soruşturmanın sonuna geldiniz. Topladığınız kanıtları ve şüpheli itiraflarını değerlendirerek nihai kararınızı verin.
          </p>
        </div>

        <!-- Durum Özeti -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-[#1C2029] rounded border border-[#2C3240] text-center">
            <p class="text-[10px] text-[#A7ADBA] uppercase font-mono-code">Toplanan Delil</p>
            <p class="text-lg font-bold text-[#C9A66B]">${collectedCount} / ${EVIDENCES.length}</p>
          </div>
          <div class="p-3 bg-[#1C2029] rounded border border-[#2C3240] text-center">
            <p class="text-[10px] text-[#A7ADBA] uppercase font-mono-code">Çözülen Çelişki</p>
            <p class="text-lg font-bold text-[#86B89A]">${solvedCount} / 3</p>
          </div>
          <div class="p-3 bg-[#1C2029] rounded border border-[#2C3240] text-center">
            <p class="text-[10px] text-[#A7ADBA] uppercase font-mono-code">Arşiv Durumu</p>
            <p class="text-lg font-bold ${this.state.archiveUnlocked ? 'text-[#86B89A]' : 'text-[#D96C6C]'}">
              ${this.state.archiveUnlocked ? 'Açıldı' : 'Kilitli'}
            </p>
          </div>
          <div class="p-3 bg-[#1C2029] rounded border border-[#2C3240] text-center">
            <p class="text-[10px] text-[#A7ADBA] uppercase font-mono-code">Soruşturma Puanı</p>
            <p class="text-lg font-bold text-[#C9A66B]">${this.state.score}</p>
          </div>
        </div>

        <div class="p-4 bg-[#101218] border-l-4 border-[#C9A66B] rounded text-xs text-[#A7ADBA] leading-relaxed">
          <strong>Dedektif Uyarı Notu:</strong> Aceleci ve kanıtsız bir suçlama davanın düşmesine, masum birinin mağdur olmasına veya Deniz'in hayatının tehlikeye girmesine yol açabilir. Dört farklı son ihtimali bulunmaktadır.
        </div>

        <!-- Karar Seçenekleri -->
        <div class="space-y-3">
          <h3 class="text-xs uppercase font-bold text-[#C9A66B] tracking-wider font-mono-code">
            Kimi Suçluyorsunuz?
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 1. Profesör Selim Er -->
            <div class="p-4 rounded-lg bg-[#1C2029] border border-[#2C3240] hover:border-[#C9A66B] transition-colors flex flex-col justify-between">
              <div>
                <h4 class="text-base font-bold text-[#E8E8ED] font-serif-title">Prof. Dr. Selim Er'i Suçla</h4>
                <p class="text-xs text-[#A7ADBA] mt-1 leading-relaxed">
                  İddia: Araştırmadaki veri sahteciliğinin örtbas edilmesi için Deniz'e baskı kurdu, arşive gizlice girdi ve Mert'i delilleri çalması için yönlendirdi.
                </p>
              </div>
              <button data-verdict="profesor" class="mt-4 w-full py-2 bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] font-bold text-xs rounded transition-colors cursor-pointer">
                Profesörü Asıl Suçlu İlan Et
              </button>
            </div>

            <!-- 2. Mert Kaya -->
            <div class="p-4 rounded-lg bg-[#1C2029] border border-[#2C3240] hover:border-[#C9A66B] transition-colors flex flex-col justify-between">
              <div>
                <h4 class="text-base font-bold text-[#E8E8ED] font-serif-title">Mert Kaya'yı Suçla</h4>
                <p class="text-xs text-[#A7ADBA] mt-1 leading-relaxed">
                  İddia: Gece yarısı 23.08'de koridorda görülen kişi Mert'ti. Deniz'in kaybolmasında ve odasının aranmasında doğrudan fail odur.
                </p>
              </div>
              <button data-verdict="mert" class="mt-4 w-full py-2 bg-[#101218] hover:bg-[#2C3240] text-[#E8E8ED] border border-[#2C3240] font-bold text-xs rounded transition-colors cursor-pointer">
                Mert Kaya'yı Suçlu İlan Et
              </button>
            </div>

            <!-- 3. Ece Yalın -->
            <div class="p-4 rounded-lg bg-[#1C2029] border border-[#2C3240] hover:border-[#C9A66B] transition-colors flex flex-col justify-between">
              <div>
                <h4 class="text-base font-bold text-[#E8E8ED] font-serif-title">Ece Yalın'ı Suçla</h4>
                <p class="text-xs text-[#A7ADBA] mt-1 leading-relaxed">
                  İddia: Deniz son mesajında açıkça "Ece'ye inanma" demiştir. Ece mesajları silmiş ve gerçekleri saklamıştır; kayboluşun sorumlusudur.
                </p>
              </div>
              <button data-verdict="ece" class="mt-4 w-full py-2 bg-[#101218] hover:bg-[#2C3240] text-[#E8E8ED] border border-[#2C3240] font-bold text-xs rounded transition-colors cursor-pointer">
                Ece Yalın'ı Suçlu İlan Et
              </button>
            </div>

            <!-- 4. Delil Yetersizliği / Ek Araştırma -->
            <div class="p-4 rounded-lg bg-[#1C2029] border border-[#2C3240] hover:border-[#C9A66B] transition-colors flex flex-col justify-between">
              <div>
                <h4 class="text-base font-bold text-[#E8E8ED] font-serif-title">Delil Yetersizliği Kararı Ver</h4>
                <p class="text-xs text-[#A7ADBA] mt-1 leading-relaxed">
                  İddia: Eldeki deliller kimseyi kesin mahkum etmeye yetmez. Soruşturmayı kapatmayın veya şüphelileri serbest bırakın.
                </p>
              </div>
              <button data-verdict="yetersiz" class="mt-4 w-full py-2 bg-[#101218] hover:bg-[#2C3240] text-[#A7ADBA] border border-[#2C3240] font-bold text-xs rounded transition-colors cursor-pointer">
                Delil Yetersizliği Kararı Ver
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- 7. FİNAL SONUÇ EKRANI (4 Farklı Son) ---
  private renderFinalScreen(): string {
    const endingId = this.state.finalEndingId || 'D';

    let endingTitle = '';
    let endingSubtitle = '';
    let endingStory = '';
    let endingTypeBadge = '';
    let rankTitle = 'Dedektif';

    if (this.state.score >= 60) rankTitle = 'Efsanevi Başmüfettiş';
    else if (this.state.score >= 40) rankTitle = 'Kıdemli Dedektif';
    else rankTitle = 'Acemi Araştırmacı';

    if (endingId === 'A') {
      endingTypeBadge = 'SON A — GERÇEK ORTAYA ÇIKTI (MÜKEMMEL SON)';
      endingTitle = 'Adalet Yerini Buldu';
      endingSubtitle = 'Orijinal veriler kurtarıldı, Deniz güvende ve sahtekarlık deşifre edildi.';
      endingStory = `
        Tebrikler Dedektif! Profesör Selim Er'in araştırmadaki veri sahteciliği ve Deniz Arman'a kurduğu komplo, toplanan arşiv belgeleri ve çürütülen yalanlarla resmen kanıtlandı.
        
        Mert Kaya savcılıkta itirafçı oldu ve Profesörün talimatlarını tek tek açıkladı. Deniz'in kampüsten kaçarak sığındığı güvenli adres tespit edildi. Deniz, elindeki orijinal veri kopyalarını bağımsız bilim kuruluna ve emniyete teslim etti. 

        Saat 00.30'a dakikalar kala adaletin terazisi doğru tarafı gösterdi. Kuzgun Üniversitesi skandalı manşetlere taşınırken, bir masumun hayatı ve bilimin onuru kurtarıldı.
      `;
    } else if (endingId === 'B') {
      endingTypeBadge = 'SON B — YANLIŞ SUÇLAMA';
      endingTitle = 'Piyon Feda Edildi, Asıl Suçlu Kaçtı';
      endingSubtitle = 'Mert Kaya tutuklandı ancak dosyalar kalıcı olarak karartıldı.';
      endingStory = `
        Mert Kaya'yı suçladınız. Mert gözaltına alındı ve panik içinde hapse gönderildi. Ancak soruşturma yanlış yönde kapandı.

        Mert sadece korkutulmuş bir öğrenci asistandı ve asıl organizatör değildi. Dikkatler Mert'in üzerindeyken Profesör Selim Er, arşivdeki tüm orijinal belgeleri ve dijital kayıtları sessizce yok etti. 

        Deniz Arman'ın güveneceği kimse kalmadı; izini kaybettirdi ve bir daha Kuzgun Üniversitesi'ne dönmedi. Gerçek hiçbir zaman aydınlanamadı.
      `;
    } else if (endingId === 'C') {
      endingTypeBadge = 'SON C — GÜVEN KIRILDI';
      endingTitle = 'Dostluk Zedelendi, İzler Kayboldu';
      endingSubtitle = 'Ece Yalın suçlandı; korku ve güvensizlik gerçeği yuttu.';
      endingStory = `
        Ece Yalın'ı suçladınız. Deniz'i korumak için elinden geleni yapan ve mesajı bu yüzden silen Ece, haksız suçlama karşısında yıkıldı ve soruşturmayla işbirliğini tamamen kesti.

        Deniz, güvendiği tek arkadaşının da polis tarafından şüpheli ilan edildiğini öğrenince büyük bir korkuya kapılarak şehri terk etti ve gizli belgeleri imha etti.

        Profesör Selim Er hiçbir bedel ödemeden kariyerine devam etti. Deniz'in geride bıraktığı son mesaj, sonsuza dek cevapsız bir bilmece olarak kaldı.
      `;
    } else {
      endingTypeBadge = 'SON D — YARIM KALAN GERÇEK';
      endingTitle = 'Delil Yetersizliği';
      endingSubtitle = 'Eksik kanıtlar nedeniyle dava düştü; gerçeğin yalnızca yarısı görüldü.';
      endingStory = `
        Mahkeme salonunda Profesör Selim Er'in güçlü avukatları delillerinizin yetersiz ve usulsüz olduğunu savunarak davayı düşürdü. Arşiv notu ve erişim günlüğü tam olarak birleştirilemediği için profesör serbest kaldı.

        Aynı gece saat 00.30'da telefonunuza şifreli anonim bir bildirim düştü:
        
        “Arşivde gördüklerin, hikâyenin yalnızca yarısıydı.”
        
        Deniz Arman'ın nerede olduğu asla öğrenilemedi. Dosya tozlu raflara "Çözülememiş Vaka" olarak kaldırıldı.
      `;
    }

    return `
      <div class="min-h-screen flex items-center justify-center p-4 md:p-8 rain-container">
        <div class="max-w-2xl w-full bg-[#1C2029] border border-[#C9A66B]/50 rounded-xl p-6 md:p-8 shadow-2xl space-y-6">
          
          <div class="flex items-center justify-between border-b border-[#2C3240] pb-3">
            <span class="text-xs font-mono-code font-bold ${endingId === 'A' ? 'text-[#86B89A]' : 'text-[#D96C6C]'}">
              ${endingTypeBadge}
            </span>
            <span class="text-xs font-mono-code text-[#A7ADBA]">18 EKİM 2026 — 00.30</span>
          </div>

          <div class="text-center space-y-2">
            <h1 class="text-3xl font-bold font-serif-title text-[#E8E8ED]">${endingTitle}</h1>
            <p class="text-sm italic text-[#C9A66B] font-serif-title">${endingSubtitle}</p>
          </div>

          <div class="p-5 bg-[#101218] rounded-lg border border-[#2C3240] text-sm text-[#E8E8ED] leading-relaxed font-serif-title text-base whitespace-pre-line">
            ${endingStory.trim()}
          </div>

          <!-- Skor ve Değerlendirme Kartı -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#141720] rounded border border-[#2C3240] text-center">
            <div>
              <p class="text-[10px] text-[#A7ADBA] uppercase font-mono-code">Final Puanı</p>
              <p class="text-xl font-bold text-[#86B89A]">${this.state.score}</p>
            </div>
            <div>
              <p class="text-[10px] text-[#A7ADBA] uppercase font-mono-code">Bulunan Kanıt</p>
              <p class="text-xl font-bold text-[#C9A66B]">${this.state.collectedEvidence.length} / ${EVIDENCES.length}</p>
            </div>
            <div>
              <p class="text-[10px] text-[#A7ADBA] uppercase font-mono-code">Çözülen Çelişki</p>
              <p class="text-xl font-bold text-[#E8E8ED]">${this.state.solvedContradictions.length} / 3</p>
            </div>
            <div>
              <p class="text-[10px] text-[#A7ADBA] uppercase font-mono-code">Rütbe</p>
              <p class="text-xs font-bold text-[#C9A66B] mt-1 truncate">${rankTitle}</p>
            </div>
          </div>

          <!-- Aksiyon Butonları -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#2C3240]">
            <button id="btn-replay-all" class="w-full sm:w-auto px-6 py-2.5 bg-[#C9A66B] hover:bg-[#d8b87e] text-[#101218] font-bold text-xs uppercase tracking-wider rounded transition-colors cursor-pointer">
              🔄 Soruşturmayı Tekrar Oyna
            </button>
            <button id="btn-return-home" class="w-full sm:w-auto px-5 py-2.5 bg-[#101218] hover:bg-[#2C3240] text-[#A7ADBA] hover:text-[#E8E8ED] font-semibold text-xs rounded border border-[#2C3240] transition-colors cursor-pointer">
              🏠 Başlangıç Ekranına Dön
            </button>
          </div>

        </div>
      </div>
    `;
  }

  // --- OLAY DİNLEYİCİLERİ (Event Binding) ---

  private bindEvents() {
    // Modal kapatma
    const modalX = document.getElementById('btn-modal-x');
    if (modalX) modalX.onclick = () => this.closeModal();

    // Başlangıç ekranı butonları
    const btnStartNew = document.getElementById('btn-start-new');
    if (btnStartNew) btnStartNew.onclick = () => this.startNewGame();

    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) btnContinue.onclick = () => this.continueGame();

    const btnHowTo = document.getElementById('btn-how-to-play');
    if (btnHowTo) btnHowTo.onclick = () => this.showHowToPlay();

    const btnFooterHowTo = document.getElementById('btn-footer-howto');
    if (btnFooterHowTo) btnFooterHowTo.onclick = () => this.showHowToPlay();

    const btnToggleSoundStart = document.getElementById('btn-toggle-sound-start');
    if (btnToggleSoundStart) btnToggleSoundStart.onclick = () => this.toggleSound();

    const btnToggleSoundTop = document.getElementById('btn-toggle-sound-top');
    if (btnToggleSoundTop) btnToggleSoundTop.onclick = () => this.toggleSound();

    // Giriş ekranı butonları
    const btnBackStart = document.getElementById('btn-back-to-start');
    if (btnBackStart) {
      btnBackStart.onclick = () => {
        this.state.screen = 'start';
        this.render();
      };
    }

    const btnOpenCase = document.getElementById('btn-open-case-file');
    if (btnOpenCase) btnOpenCase.onclick = () => this.openGameFile();

    // Sekme değiştirme butonları
    const tabBtns = this.container.querySelectorAll('.tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetTab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as GameState['activeTab'];
        if (targetTab) this.switchTab(targetTab);
      });
    });

    // İpucu al
    const btnHint = document.getElementById('btn-get-hint');
    if (btnHint) btnHint.onclick = () => this.giveHint();

    // Soruşturmayı sıfırla
    const btnRestart = document.getElementById('btn-restart-game');
    if (btnRestart) {
      btnRestart.onclick = () => {
        if (window.confirm('Mevcut soruşturma ilerlemenizi sıfırlayıp baştan başlamak istiyor musunuz?')) {
          this.resetGame();
        }
      };
    }

    // Kanıt İnceleme Butonları (Olay Yeri & Defter)
    const inspectBtns = this.container.querySelectorAll('[data-inspect]');
    inspectBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const eid = (e.currentTarget as HTMLElement).getAttribute('data-inspect');
        if (eid) this.inspectEvidence(eid);
      });
    });

    // Kanıt Seçme (İlişkilendirme için)
    const selectRelationBtns = this.container.querySelectorAll('[data-select-relation]');
    selectRelationBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const eid = (e.currentTarget as HTMLElement).getAttribute('data-select-relation');
        if (eid) this.toggleSelectEvidenceForRelation(eid);
      });
    });

    // Kanıtları İlişkilendir Butonu
    const btnCombine = document.getElementById('btn-combine-evidence');
    if (btnCombine) btnCombine.onclick = () => this.combineSelectedEvidence();

    // Şüpheli seçimi (Sorgu ekranı)
    const selectSuspectBtns = this.container.querySelectorAll('[data-select-suspect]');
    selectSuspectBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const sid = (e.currentTarget as HTMLElement).getAttribute('data-select-suspect');
        if (sid) this.selectSuspect(sid);
      });
    });

    // Şüpheli kartından sorguya git butonu
    const goInterrogateBtns = this.container.querySelectorAll('[data-go-interrogate]');
    goInterrogateBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const sid = (e.currentTarget as HTMLElement).getAttribute('data-go-interrogate');
        if (sid) {
          this.state.selectedSuspectId = sid;
          this.switchTab('interrogation');
        }
      });
    });

    // Soru sorma butonu
    const askQBtns = this.container.querySelectorAll('[data-ask-q]');
    askQBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idxStr = (e.currentTarget as HTMLElement).getAttribute('data-ask-q');
        if (idxStr !== null) {
          this.askSuspectQuestion(this.state.selectedSuspectId, parseInt(idxStr, 10));
        }
      });
    });

    // Çelişen Kanıtı Göster Butonu
    const btnContradiction = document.getElementById('btn-open-contradiction');
    if (btnContradiction) {
      btnContradiction.onclick = () => {
        this.openContradictionModal(this.state.selectedSuspectId);
      };
    }

    // Karar Masası Butonları
    const verdictBtns = this.container.querySelectorAll('[data-verdict]');
    verdictBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).getAttribute('data-verdict') as 'profesor' | 'mert' | 'ece' | 'yetersiz';
        if (target) {
          if (window.confirm('Bu nihai kararınız mı? Soruşturma sonlanacak.')) {
            this.makeVerdict(target);
          }
        }
      });
    });

    // Final Ekranı Butonları
    const btnReplayAll = document.getElementById('btn-replay-all');
    if (btnReplayAll) {
      btnReplayAll.onclick = () => {
        this.resetGame();
      };
    }

    const btnReturnHome = document.getElementById('btn-return-home');
    if (btnReturnHome) {
      btnReturnHome.onclick = () => {
        this.state.screen = 'start';
        this.saveGame();
        this.render();
      };
    }
  }
}

// Global initialization function
export function initGame(rootElement: HTMLElement): DetectiveGame {
  return new DetectiveGame(rootElement);
}
