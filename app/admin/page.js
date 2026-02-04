// app/admin/page.js
"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; 
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { Lock, LogIn } from "lucide-react";

export default function Admin() {
  // --- GÜVENLİK ---
  const SABIT_SIFRE = "1453"; 
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [girilenSifre, setGirilenSifre] = useState("");

  // --- TÜM AYARLAR ---
  const [form, setForm] = useState({
    // İstatistikler
    toplananSayi: 0, 
    hedefSayi: 0, 
    birimFiyat: 0, 
    // Metinler
    slogan: "",
    icerikMetni: "",
    // Görseller
    logoUrl: "", 
    urunResmi: "", 
    puzzleResmi: "", // YENİ EKLENDİ (Puzzle)
    // Banka
    bankaAdi: "", 
    iban: "", 
    aliciAdi: ""
  });
  
  // --- LİSTELER ---
  const [bekleyenler, setBekleyenler] = useState([]);
  const [bagislar, setBagislar] = useState([]);
  
  // --- DİĞER STATELER ---
  const [manuelForm, setManuelForm] = useState({ isim: "", adet: 1 });
  const [resimYukleniyor, setResimYukleniyor] = useState(false);
  const [onayIsmi, setOnayIsmi] = useState("");
  const [seciliBekleyen, setSeciliBekleyen] = useState(null);

  // --- BAŞLANGIÇ ---
  useEffect(() => {
    const kayitliOturum = localStorage.getItem("admin_giris");
    if(kayitliOturum === "ok") setGirisYapildi(true);
    
    if (girisYapildi) {
        verileriGetir(); 
        bekleyenleriGetir(); 
        bagislariGetir();
    }
  }, [girisYapildi]);

  // --- GİRİŞ/ÇIKIŞ ---
  const girisKontrol = (e) => {
      e.preventDefault();
      if(girilenSifre === SABIT_SIFRE) {
          setGirisYapildi(true);
          localStorage.setItem("admin_giris", "ok");
      } else {
          alert("Hatalı Şifre!");
          setGirilenSifre("");
      }
  };

  const cikisYap = () => {
      setGirisYapildi(false);
      localStorage.removeItem("admin_giris");
  };

  // --- FIREBASE VERİ ÇEKME ---
  const verileriGetir = async () => {
    const docSnap = await getDoc(doc(db, "ayarlar", "genel"));
    if (docSnap.exists()) setForm(docSnap.data());
  };

  const bekleyenleriGetir = async () => {
    const q = await getDocs(collection(db, "bekleyen_bagislar"));
    setBekleyenler(q.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const bagislariGetir = async () => {
    const q = await getDocs(collection(db, "bagislar"));
    const veri = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Tarihe göre sırala (Yeniler en üstte)
    veri.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    setBagislar(veri);
  };

  // --- RESİM YÜKLEME (Base64) ---
  const dosyaOku = (e, alanAdi) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { alert("Resim çok büyük! 1MB altı yükleyin."); return; }
    
    setResimYukleniyor(true);
    const reader = new FileReader();
    reader.onloadend = () => {
        setForm(prev => ({ ...prev, [alanAdi]: reader.result }));
        setResimYukleniyor(false);
    };
    reader.readAsDataURL(file);
  };

  // --- KAYDETME ---
  const ayarlariGuncelle = async () => {
    try {
        await updateDoc(doc(db, "ayarlar", "genel"), form);
        alert("✅ Tüm ayarlar başarıyla kaydedildi!");
    } catch (error) {
        console.error(error);
        alert("Hata oluştu.");
    }
  };

  // --- WHATSAPP YARDIMCISI ---
  const whatsappAc = (telefon, mesaj) => {
    let temizNo = telefon.replace(/\D/g, ''); 
    if (temizNo.startsWith('0')) temizNo = temizNo.substring(1);
    if (!temizNo.startsWith('90')) temizNo = '90' + temizNo;
    window.open(`https://wa.me/${temizNo}?text=${encodeURIComponent(mesaj)}`, '_blank');
  };

  // --- ONAYLAMA İŞLEMİ ---
  const bagisiOnayla = async (bekleyen) => {
    if(!onayIsmi) return alert("Lütfen listede görünecek ismi yazın.");

    // 1. Listeye Ekle
    await addDoc(collection(db, "bagislar"), {
        isim: onayIsmi,
        adet: Number(bekleyen.adet),
        tarih: new Date().toISOString()
    });

    // 2. Toplamı Güncelle
    const yeniToplanan = Number(form.toplananSayi) + Number(bekleyen.adet);
    setForm(prev => ({ ...prev, toplananSayi: yeniToplanan }));
    await updateDoc(doc(db, "ayarlar", "genel"), { toplananSayi: yeniToplanan });

    // 3. Bekleyenlerden Sil
    await deleteDoc(doc(db, "bekleyen_bagislar", bekleyen.id));

    // 4. WhatsApp Mesajı
    const mesaj = `Merhaba, ${bekleyen.adet} adet kumanya bağışınız tarafımıza ulaşmıştır ve "${onayIsmi}" adıyla listeye eklenmiştir. Allah kabul etsin.`;
    whatsappAc(bekleyen.telefon, mesaj);

    setSeciliBekleyen(null);
    setOnayIsmi("");
    bekleyenleriGetir();
    bagislariGetir();
  };

  const bagisiReddet = async (id, telefon) => {
    if(!confirm("Bu kaydı silmek ve reddetmek istediğine emin misin?")) return;
    
    await deleteDoc(doc(db, "bekleyen_bagislar", id));
    whatsappAc(telefon, "Merhaba, bağış bildiriminizde bir sorun oluştu veya ödeme görüntülenemedi. Lütfen kontrol edip tekrar deneyiniz.");
    bekleyenleriGetir();
  };

  // --- MANUEL EKLEME ---
  const manuelEkle = async () => {
      if(!manuelForm.isim) return alert("İsim yazın");
      
      await addDoc(collection(db, "bagislar"), {
          isim: manuelForm.isim,
          adet: Number(manuelForm.adet),
          tarih: new Date().toISOString()
      });
      
      const yeniToplanan = Number(form.toplananSayi) + Number(manuelForm.adet);
      setForm(prev => ({...prev, toplananSayi: yeniToplanan}));
      await updateDoc(doc(db, "ayarlar", "genel"), { toplananSayi: yeniToplanan });
      
      setManuelForm({isim: "", adet: 1});
      bagislariGetir();
  };

  const manuelSil = async (id, adet) => {
      if(!confirm("Silmek istiyor musun?")) return;
      
      await deleteDoc(doc(db, "bagislar", id));
      
      const yeniToplanan = Number(form.toplananSayi) - Number(adet);
      setForm(prev => ({...prev, toplananSayi: yeniToplanan}));
      await updateDoc(doc(db, "ayarlar", "genel"), { toplananSayi: yeniToplanan });
      
      bagislariGetir();
  };

  // --- GİRİŞ EKRANI ---
  if (!girisYapildi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={girisKontrol} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Yönetici Paneli</h2>
            <input 
                type="password" 
                placeholder="Şifre" 
                className="w-full p-3 border rounded-xl mb-4 text-center text-lg outline-none focus:ring-2 focus:ring-amber-500"
                value={girilenSifre}
                onChange={(e) => setGirilenSifre(e.target.value)}
                autoFocus
            />
            <button type="submit" className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition flex items-center justify-center gap-2">
                <LogIn size={20} /> GİRİŞ YAP
            </button>
        </form>
      </div>
    );
  }

  // --- PANEL İÇERİĞİ ---
  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <div className="flex justify-between items-center mb-6 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-amber-800">YÖNETİCİ PANELİ</h1>
        <button onClick={cikisYap} className="bg-red-50 text-red-600 px-4 py-2 rounded font-bold text-sm hover:bg-red-100">ÇIKIŞ YAP</button>
      </div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SOL KOLON */}
        <div className="space-y-6">
            
            {/* BANKA */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500 space-y-3">
                <h2 className="font-bold text-blue-700 text-lg">Banka Bilgileri</h2>
                <input type="text" placeholder="Banka Adı" className="w-full p-2 border rounded" value={form.bankaAdi || ""} onChange={(e) => setForm({...form, bankaAdi: e.target.value})} />
                <input type="text" placeholder="Alıcı Adı Soyadı" className="w-full p-2 border rounded" value={form.aliciAdi || ""} onChange={(e) => setForm({...form, aliciAdi: e.target.value})} />
                <input type="text" placeholder="IBAN (TR...)" className="w-full p-2 border rounded" value={form.iban || ""} onChange={(e) => setForm({...form, iban: e.target.value})} />
            </div>

            {/* GÖRSELLER (3 ADET) */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-amber-500 space-y-3">
                <h2 className="font-bold text-amber-700 text-lg">Görseller</h2>
                
                {/* 1. Logo */}
                <div className="flex items-center gap-4 border p-2 rounded bg-gray-50">
                    <div className="w-16 h-16 bg-white border flex items-center justify-center">
                        {form.logoUrl ? <img src={form.logoUrl} className="max-h-14 object-contain"/> : <span className="text-xs">Yok</span>}
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold block mb-1">LOGO</label>
                        <input type="file" onChange={(e) => dosyaOku(e, 'logoUrl')} className="text-sm w-full"/>
                    </div>
                </div>

                {/* 2. Ürün Resmi */}
                <div className="flex items-center gap-4 border p-2 rounded bg-gray-50">
                    <div className="w-16 h-16 bg-white border flex items-center justify-center">
                        {form.urunResmi ? <img src={form.urunResmi} className="max-h-14 object-contain"/> : <span className="text-xs">Yok</span>}
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold block mb-1">KUMANYA PAKETİ</label>
                        <input type="file" onChange={(e) => dosyaOku(e, 'urunResmi')} className="text-sm w-full"/>
                    </div>
                </div>

                {/* 3. Puzzle Resmi (YENİ) */}
                <div className="flex items-center gap-4 border-2 border-dashed border-amber-300 p-2 rounded bg-amber-50">
                    <div className="w-16 h-16 bg-white border flex items-center justify-center">
                        {form.puzzleResmi ? <img src={form.puzzleResmi} className="max-h-14 object-contain"/> : <span className="text-xs">Yok</span>}
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold block mb-1 text-amber-800">PUZZLE RESMİ (RENKLİ)</label>
                        <input type="file" onChange={(e) => dosyaOku(e, 'puzzleResmi')} className="text-sm w-full"/>
                    </div>
                </div>
            </div>

            {/* METİNLER & RAKAMLAR */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-gray-500 space-y-3">
                <h2 className="font-bold text-gray-700 text-lg">İçerik Ayarları</h2>
                <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs font-bold">Toplanan</label><input type="number" className="w-full p-2 border rounded" value={form.toplananSayi} onChange={(e) => setForm({...form, toplananSayi: e.target.value})} /></div>
                    <div><label className="text-xs font-bold">Hedef</label><input type="number" className="w-full p-2 border rounded" value={form.hedefSayi} onChange={(e) => setForm({...form, hedefSayi: e.target.value})} /></div>
                    <div><label className="text-xs font-bold">Fiyat</label><input type="number" className="w-full p-2 border rounded" value={form.birimFiyat} onChange={(e) => setForm({...form, birimFiyat: e.target.value})} /></div>
                </div>
                
                <div>
                    <label className="text-xs font-bold">Sloganlar (Alt alta)</label>
                    <textarea rows="3" className="w-full p-2 border rounded" value={form.slogan} onChange={(e) => setForm({...form, slogan: e.target.value})}></textarea>
                </div>

                <div>
                    <label className="text-xs font-bold">Paket İçeriği</label>
                    <textarea rows="5" className="w-full p-2 border rounded font-mono text-sm" value={form.icerikMetni} onChange={(e) => setForm({...form, icerikMetni: e.target.value})}></textarea>
                </div>

                <button onClick={ayarlariGuncelle} disabled={resimYukleniyor} className="w-full bg-amber-600 text-white p-3 rounded font-bold hover:bg-amber-700 text-lg shadow-lg">
                    {resimYukleniyor ? "Resim İşleniyor..." : "AYARLARI KAYDET"}
                </button>
            </div>
        </div>

        {/* SAĞ KOLON */}
        <div className="space-y-6">
            
            {/* ONAY BEKLEYENLER */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-red-500 min-h-[300px]">
                <h2 className="text-xl font-bold text-red-600 border-b pb-2 mb-4 flex justify-between">
                    Onay Bekleyenler 
                    <span className="bg-red-100 px-3 rounded-full text-sm py-1">{bekleyenler.length}</span>
                </h2>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {bekleyenler.length === 0 && <p className="text-gray-400 text-sm italic">Bekleyen işlem yok.</p>}
                    {bekleyenler.map((b) => (
                        <div key={b.id} className="bg-red-50 p-3 rounded-lg border border-red-100 shadow-sm">
                            <div className="flex justify-between font-bold text-gray-800 mb-1">
                                <span>{b.adSoyad}</span>
                                <span className="text-red-600 bg-white px-2 rounded border border-red-100">{b.adet} Adet</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-3 flex justify-between">
                                <span>{b.telefon}</span>
                                <span>{new Date(b.tarih).toLocaleDateString()}</span>
                            </div>
                            
                            {seciliBekleyen === b.id ? (
                                <div className="bg-white p-3 rounded border shadow-inner animate-in fade-in">
                                    <label className="text-xs font-bold text-gray-400">Listede Görünecek İsim:</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded mb-2 text-sm font-bold text-green-700 border-green-200"
                                        value={onayIsmi}
                                        onChange={(e) => setOnayIsmi(e.target.value)}
                                        placeholder="Örn: Hayırsever"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => bagisiOnayla(b)} className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-bold hover:bg-green-700">✅ ONAYLA</button>
                                        <button onClick={() => setSeciliBekleyen(null)} className="px-3 bg-gray-200 text-gray-600 rounded text-sm font-bold hover:bg-gray-300">İptal</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => { setSeciliBekleyen(b.id); setOnayIsmi(b.adSoyad); }} className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700 shadow-sm">İNCELE & ONAYLA</button>
                                    <button onClick={() => bagisiReddet(b.id, b.telefon)} className="px-3 bg-white border border-red-300 text-red-500 rounded text-xs font-bold hover:bg-red-50">RED</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* MANUEL EKLEME */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
                <h2 className="text-xl font-bold text-green-700 border-b pb-2 mb-4">Manuel Ekleme</h2>
                
                <div className="flex gap-2 mb-4 bg-green-50 p-3 rounded-lg border border-green-100">
                    <input type="text" placeholder="İsim" className="flex-1 p-2 border rounded text-sm" value={manuelForm.isim} onChange={(e) => setManuelForm({...manuelForm, isim: e.target.value})} />
                    <input type="number" className="w-16 p-2 border rounded text-center text-sm font-bold" value={manuelForm.adet} onChange={(e) => setManuelForm({...manuelForm, adet: e.target.value})} />
                    <button onClick={manuelEkle} className="bg-green-600 text-white px-4 rounded font-bold hover:bg-green-700 shadow-sm">+</button>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-1">
                    {bagislar.map((b) => (
                        <div key={b.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 border-b group">
                            <span>{b.isim} <span className="font-bold text-green-600">({b.adet})</span></span>
                            <button onClick={() => manuelSil(b.id, b.adet)} className="text-red-400 text-xs hover:text-red-600 hover:underline opacity-0 group-hover:opacity-100 transition">Sil</button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}