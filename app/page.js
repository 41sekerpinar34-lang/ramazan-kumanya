// app/page.js
"use client";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase"; 
import { doc, onSnapshot, collection, addDoc } from "firebase/firestore";
import { Share2, CreditCard, ShoppingBag, PackageCheck, Copy, X, Phone, MapPin, FileText, Shield, Info, HeartHandshake } from "lucide-react";

export default function Home() {
  // --- STATE TANIMLAMALARI ---
  const [data, setData] = useState(null);
  const [bagislar, setBagislar] = useState([]);
  const [toplamBagisciSayisi, setToplamBagisciSayisi] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modallar
  const [modalAcik, setModalAcik] = useState(false);
  const [odemeYontemi, setOdemeYontemi] = useState(null); 
  const [yasalModalAcik, setYasalModalAcik] = useState(false);
  const [seciliYasalBaslik, setSeciliYasalBaslik] = useState("");
  const [seciliYasalIcerik, setSeciliYasalIcerik] = useState("");

  // Form
  const [form, setForm] = useState({ adSoyad: "", telefon: "", adet: 1 });
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // Kurumsal Bilgiler
  const KURUM_ADI = "Şekerpınar Nazmi Balcı Erkek Öğrenci Yurdu";
  const ADRES = "Cumhuriyet, Namık Kemal Cd. No:25, 41444 Çayırova/Kocaeli";
  const TELEFON = "0505 916 80 33";

  // --- VERİ ÇEKME ---
  useEffect(() => {
    // Genel Ayarları Dinle
    const ayarDinle = onSnapshot(doc(db, "ayarlar", "genel"), (doc) => {
      setData(doc.data());
      setLoading(false);
    });
    // Bağış Listesini Dinle
    const bagisDinle = onSnapshot(collection(db, "bagislar"), (snap) => {
        const liste = snap.docs.map(d => d.data());
        liste.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
        setBagislar(liste.slice(0, 5)); // Son 5 kişi
        setToplamBagisciSayisi(liste.length);
    });
    return () => { ayarDinle(); bagisDinle(); };
  }, []);

  // --- BİLDİRİM GÖNDERME ---
  const bildirimGonder = async (e) => {
    e.preventDefault();
    if(!form.adSoyad || !form.telefon || form.adet < 1) return alert("Lütfen tüm alanları doldurun.");
    
    setGonderiliyor(true);
    try {
        await addDoc(collection(db, "bekleyen_bagislar"), {
            ...form,
            tarih: new Date().toISOString()
        });
        alert("✅ Bağış bildiriminiz alındı! Kontrol edildikten sonra size dönüş yapılacaktır.");
        setModalAcik(false);
        setForm({ adSoyad: "", telefon: "", adet: 1 });
    } catch (error) {
        alert("Bir hata oluştu.");
    } finally {
        setGonderiliyor(false);
    }
  };

  // --- YASAL METİN AÇMA ---
  const yasalMetinAc = (tip) => {
    let baslik = "";
    let icerik = "";

    if(tip === 1) {
        baslik = "Mesafeli Satış Sözleşmesi";
        icerik = `1. TARAFLAR\nSatıcı (Bağış Alan): ${KURUM_ADI}\nAdres: ${ADRES}\nTelefon: ${TELEFON}\n\n2. KONU\nİşbu sözleşmenin konusu, Web sitesi üzerinden yapılan Ramazan Kumanyası bağış işlemidir.\n\n3. CAYMA HAKKI\nBağış işlemi, ifa edildikten sonra geri alınamayan hizmetler kapsamında olduğundan cayma hakkı bulunmamaktadır. Ancak sehven yapılan hatalı ödemeler için kurum ile iletişime geçiniz.`;
    } else if (tip === 2) {
        baslik = "Gizlilik ve Güvenlik Politikası";
        icerik = `Verileriniz (Ad, Soyad, Telefon) sadece bağış sürecini yönetmek için kullanılır. Kredi kartı bilgileriniz sistemlerimizde asla saklanmaz, banka altyapısı üzerinden güvenle işlenir.`;
    } else if (tip === 3) {
        baslik = "İptal ve İade Koşulları";
        icerik = `Bağış niteliğindeki ödemelerin iadesi kural olarak mümkün değildir. Sistemsel hata sonucu fazla çekim yapılması durumunda iade talebi oluşturabilirsiniz.`;
    }

    setSeciliYasalBaslik(baslik);
    setSeciliYasalIcerik(icerik);
    setYasalModalAcik(true);
  };

  // --- YÜKLENİYOR EKRANI ---
  if (loading || !data) return <div className="h-screen flex items-center justify-center bg-[#fdfbf7] text-amber-800 font-bold animate-pulse text-lg">Yükleniyor...</div>;

  // --- HESAPLAMALAR ---
  const yuzde = data.hedefSayi > 0 ? Math.min(((data.toplananSayi / data.hedefSayi) * 100), 100) : 0;
  const griTonlama = 100 - yuzde; // Puzzle için gri oranı
  
  const icerikListesi = data.icerikMetni ? data.icerikMetni.split('\n') : [];
  const sloganListesi = data.slogan ? data.slogan.split('\n') : [];
  const kalanBagisci = toplamBagisciSayisi - 5;

  return (
    <div className="min-h-screen bg-[#ebe7e0] font-sans text-gray-800 flex flex-col">
      
      {/* ANA İÇERİK */}
      <div className="flex-grow flex items-center justify-center p-0 md:p-4 my-8">
          <div className="w-full max-w-[1000px] bg-white shadow-2xl md:rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[650px] border border-white/50">
            
            {/* SOL TARAF (GÖRSELLER) */}
            <div className="w-full md:w-5/12 bg-gradient-to-b from-amber-100 via-amber-50 to-white p-6 md:p-8 flex flex-col relative border-b md:border-b-0 md:border-r border-amber-100/80">
              
              {/* Logo ve Başlık */}
              <div className="text-center mb-6 z-10 relative">
                {data.logoUrl && <img src={data.logoUrl} alt="Logo" className="w-auto h-32 md:h-40 mx-auto object-contain drop-shadow-md transform hover:scale-105 transition duration-500" />}
                <h1 className="text-3xl font-serif font-black text-amber-900 leading-none mt-4 mb-2 drop-shadow-sm">RAMAZAN<br/>KUMANYASI</h1>
                <div className="space-y-1">
                    {sloganListesi.map((slg, index) => (<p key={index} className="text-amber-800 text-sm font-medium italic relative inline-block px-4">{slg}</p>))}
                </div>
              </div>

              {/* === PUZZLE ALANI (YENİ) === */}
              {data.puzzleResmi && (
                <div className="mb-8 relative z-10 text-center animate-in fade-in zoom-in duration-500">
                  <div className="relative rounded-xl overflow-hidden shadow-lg border-4 border-white bg-gray-200 group">
                    {/* Resim: Gri başlar, yüzde arttıkça renklenir */}
                    <img 
                      src={data.puzzleResmi} 
                      alt="Hedef Puzzle" 
                      className="w-full h-auto object-cover transition-all duration-1000 ease-in-out transform group-hover:scale-105"
                      style={{ filter: `grayscale(${griTonlama}%)` }} 
                    />
                    {/* Yüzde Etiketi */}
                    <div className="absolute top-2 right-2 bg-amber-500 text-white font-black text-xs md:text-sm px-3 py-1 rounded-full shadow-md z-20">
                      %{yuzde.toFixed(0)} TAMAMLANDI
                    </div>
                  </div>
                  
                  {/* Hedef Vurgusu */}
                  <div className="mt-4 bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-200">
                      <div className="h-full bg-amber-500 transition-all duration-1000" style={{width: `${yuzde}%`}}></div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-amber-900 flex items-center justify-center gap-2">
                      <HeartHandshake size={28} className="text-amber-600" />
                      HEDEF: <span className="text-amber-600 underline decoration-4 decoration-amber-300">{data.hedefSayi} AİLE</span>
                    </h2>
                    <p className="text-sm text-amber-800 font-bold mt-1">Bu Ramazan'da sofralar boş kalmasın.</p>
                  </div>
                </div>
              )}
              {/* =========================== */}

              {/* Ürün Resmi ve Fiyat */}
              <div className="flex-shrink-0 flex items-center justify-center relative mt-4 mb-8 group z-10">
                <div className="absolute inset-0 bg-amber-400 rounded-full blur-[60px] opacity-20 scale-75 group-hover:scale-90 transition duration-700"></div>
                
                {/* Fiyat Balonu */}
                <div className="absolute top-0 right-2 bg-gradient-to-br from-red-600 to-red-800 text-white px-4 py-2 rounded-xl shadow-xl rotate-12 z-20 border-2 border-white/30 transform group-hover:rotate-6 transition">
                    <span className="text-[10px] font-bold opacity-90 block text-center tracking-widest leading-tight">BİRİM<br/>BEDELİ</span>
                    <span className="text-2xl font-black leading-none">{data.birimFiyat}<span className="text-sm align-top">₺</span></span>
                </div>
                
                <img src={data.urunResmi || "https://cdn-icons-png.flaticon.com/512/679/679821.png"} className="w-64 md:w-72 object-contain relative z-10 drop-shadow-2xl hover:scale-105 transition duration-500" />
              </div>

            </div>

            {/* SAĞ TARAF (BİLGİLER VE LİSTE) */}
            <div className="w-full md:w-7/12 p-6 md:p-8 bg-white flex flex-col relative">
              
              {/* Paket İçeriği */}
              <div className="mb-6 relative z-10">
                <h3 className="flex items-center gap-2 font-bold text-amber-900 pb-3 mb-4 uppercase text-sm tracking-wider border-b border-gray-100">
                    <ShoppingBag size={18} className="text-amber-500" /> Paket İçeriği
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                    {icerikListesi.map((item, index) => {
                        const parts = item.split(':');
                        return (
                            <div key={index} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-amber-200 transition-colors group shadow-sm">
                                <span className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                                    <PackageCheck size={16} className="text-amber-400/70 group-hover:text-amber-500 transition-colors" />
                                    {parts[0]}
                                </span>
                                {parts[1] && <span className="font-bold text-gray-900 bg-white px-2.5 py-1 rounded-md text-xs border border-gray-200 shadow-sm whitespace-nowrap">{parts[1]}</span>}
                            </div>
                        )
                    })}
                </div>
              </div>

              {/* Son Destekler Listesi */}
              <div className="flex-1 flex flex-col mb-6 bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4 border border-gray-100 relative z-10">
                <h3 className="font-bold text-gray-500 mb-3 uppercase text-xs tracking-wider text-center flex items-center justify-center gap-2">
                    Son Destekler
                </h3>
                
                {/* Mini İlerleme */}
                <div className="mb-4 px-2">
                  <div className="flex justify-between text-xs font-bold text-amber-900/70 uppercase mb-1">
                      <span>İlerleme Durumu</span>
                      <span className="text-amber-700">%{yuzde.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${yuzde}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                      <span>{data.toplananSayi} Toplanan</span>
                      <span>{data.hedefSayi} Hedef</span>
                  </div>
                </div>

                <div className="space-y-2.5 mb-auto overflow-y-auto max-h-[200px] pr-1">
                    {bagislar.map((b, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs border border-white shadow-sm">
                                    {b.isim.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-gray-700 line-clamp-1">{b.isim}</span>
                            </div>
                            <span className="text-xs font-extrabold bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
                                {b.adet} Paket
                            </span>
                        </div>
                    ))}
                    {bagislar.length === 0 && <p className="text-center text-gray-400 text-sm italic py-4">Henüz listelenen bağış yok.</p>}
                </div>
                {kalanBagisci > 0 && (<p className="text-center text-xs font-medium text-gray-500 mt-3 pt-2 border-t border-gray-200">...ve <span className="font-bold text-amber-700">{kalanBagisci} hayırsever</span> daha.</p>)}
              </div>

              {/* === DİPNOT (YENİ) === */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start relative z-10 shadow-sm">
                <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  <span className="font-bold">Bilgilendirme:</span> Satın aldığınız kumanyalar, talebinize göre ekiplerimiz tarafından ihtiyaç sahiplerine ulaştırılabilir ya da tarafınızdan teslim alınarak bizzat sizlerce dağıtılabilir.
                </p>
              </div>
              {/* ===================== */}

              {/* BUTONLAR */}
              <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
                <button onClick={() => setModalAcik(true)} className="bg-gradient-to-tr from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-200/50 flex items-center justify-center gap-2 transition transform active:scale-[0.98] group overflow-hidden relative">
                  <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition duration-700"></div>
                  <CreditCard size={20} /> BAĞIŞ YAP
                </button>
                <button onClick={() => navigator.share ? navigator.share({title:'Ramazan Kumanyası', url:window.location.href}) : alert("Link kopyalandı!")} className="bg-white border-2 border-gray-200 hover:border-amber-400 text-gray-700 hover:text-amber-700 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition transform active:scale-[0.98] shadow-sm hover:shadow-md">
                  <Share2 size={20} /> PAYLAŞ
                </button>
              </div>
            </div>
          </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 mt-auto">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h4 className="text-white font-bold text-lg mb-4">İletişim</h4>
                <div className="flex items-start gap-3">
                    <MapPin className="text-amber-500 mt-1 shrink-0" size={20} />
                    <p className="text-sm">{ADRES}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Phone className="text-amber-500 shrink-0" size={20} />
                    <p className="text-sm">{TELEFON}</p>
                </div>
                <div className="pt-4">
                    <p className="text-xs text-gray-500">{KURUM_ADI}</p>
                </div>
            </div>
            <div className="space-y-3 md:text-right">
                <h4 className="text-white font-bold text-lg mb-4">Kurumsal</h4>
                
                <button onClick={() => yasalMetinAc(1)} className="flex items-center gap-2 text-sm hover:text-white transition w-full md:justify-end group">
                    <FileText size={16} className="group-hover:text-amber-500" />
                    Mesafeli Satış Sözleşmesi
                </button>
                
                <button onClick={() => yasalMetinAc(2)} className="flex items-center gap-2 text-sm hover:text-white transition w-full md:justify-end group">
                    <Shield size={16} className="group-hover:text-green-500" />
                    Gizlilik ve Güvenlik Politikası
                </button>

                <button onClick={() => yasalMetinAc(3)} className="flex items-center gap-2 text-sm hover:text-white transition w-full md:justify-end group">
                    <Info size={16} className="group-hover:text-blue-500" />
                    İptal ve İade Koşulları
                </button>
            </div>
        </div>
        <div className="text-center text-xs text-gray-600 mt-10 border-t border-gray-800 pt-6">
            © 2026 Tüm Hakları Saklıdır.
        </div>
      </footer>

      {/* === BAĞIŞ MODALI === */}
      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                
                <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center">
                    <h3 className="font-bold text-amber-900 text-lg">Bağış Yöntemi Seçin</h3>
                    <button onClick={() => setModalAcik(false)} className="p-2 bg-white rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition"><X size={20}/></button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button onClick={() => setOdemeYontemi('iban')} className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition ${odemeYontemi === 'iban' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-100 hover:border-gray-300 text-gray-500'}`}>
                            <span className="text-2xl">🏦</span> HAVALE / EFT
                        </button>
                        <button onClick={() => setOdemeYontemi('kredi_karti')} className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition ${odemeYontemi === 'kredi_karti' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-100 hover:border-gray-300 text-gray-500'}`}>
                            <span className="text-2xl">💳</span> KREDİ KARTI
                        </button>
                    </div>

                    {odemeYontemi === 'kredi_karti' && (
                        <div className="text-center space-y-4 animate-in fade-in">
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-700 text-sm">
                                <p className="font-bold mb-1">⚠️ Banka Komisyon Uyarısı</p>
                                <p>Kredi kartı ile yapılan ödemelerde banka altyapısı tarafından <strong>%3 komisyon</strong> kesilmektedir.</p>
                            </div>
                            <button className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition">
                                ÖDEME EKRANINA GİT (DEMO)
                            </button>
                        </div>
                    )}

                    {odemeYontemi === 'iban' && (
                        <div className="space-y-5 animate-in fade-in">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm space-y-3 relative">
                                <div><span className="text-xs font-bold text-gray-400 block">BANKA</span><span className="font-bold text-gray-800">{data?.bankaAdi || "Banka Girilmedi"}</span></div>
                                <div><span className="text-xs font-bold text-gray-400 block">ALICI ADI</span><div className="flex justify-between items-center"><span className="font-bold text-gray-800">{data?.aliciAdi || "Alıcı Girilmedi"}</span><button onClick={() => navigator.clipboard.writeText(data?.aliciAdi)} className="text-amber-600 text-xs font-bold flex items-center gap-1 hover:underline"><Copy size={12}/> Kopyala</button></div></div>
                                <div className="bg-white p-2 rounded border border-gray-200"><span className="text-xs font-bold text-gray-400 block mb-1">IBAN NO</span><div className="flex justify-between items-center gap-2"><span className="font-mono font-bold text-gray-800 text-xs sm:text-sm break-all">{data?.iban || "TR..."}</span><button onClick={() => navigator.clipboard.writeText(data?.iban)} className="text-amber-600 text-xs font-bold flex items-center gap-1 hover:underline shrink-0"><Copy size={12}/> Kopyala</button></div></div>
                            </div>
                            <form onSubmit={bildirimGonder} className="space-y-3">
                                <p className="text-sm font-bold text-gray-700">Ödemeyi Yaptıktan Sonra Formu Doldurun 👇</p>
                                <div className="flex gap-2">
                                    <input required type="text" placeholder="Ad Soyad" className="flex-1 p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-amber-500" value={form.adSoyad} onChange={(e) => setForm({...form, adSoyad: e.target.value})} />
                                    <input required type="number" min="1" placeholder="Adet" className="w-20 p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-amber-500 text-center font-bold" value={form.adet} onChange={(e) => setForm({...form, adet: e.target.value})} />
                                </div>
                                <input required type="tel" placeholder="Telefon (05...)" className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-amber-500" value={form.telefon} onChange={(e) => setForm({...form, telefon: e.target.value})} />
                                <button disabled={gonderiliyor} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:opacity-50">
                                    {gonderiliyor ? "GÖNDERİLİYOR..." : "ÖDEMEYİ YAPTIM, BİLDİR"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* === YASAL METİN MODALI === */}
      {yasalModalAcik && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="font-bold text-lg text-gray-800">{seciliYasalBaslik}</h3>
                    <button onClick={() => setYasalModalAcik(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto whitespace-pre-wrap text-sm text-gray-600 leading-relaxed font-mono bg-white">
                    {seciliYasalIcerik}
                </div>
                <div className="p-4 border-t bg-gray-50 rounded-b-2xl text-right">
                    <button onClick={() => setYasalModalAcik(false)} className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800">Kapat</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}