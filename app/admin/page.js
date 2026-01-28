// app/admin/page.js
"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; 
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";

export default function Admin() {
  // TÜM AYARLAR (Eskiler + Yeniler)
  const [form, setForm] = useState({
    // Eski Ayarlar
    toplananSayi: 0, hedefSayi: 0, birimFiyat: 0, slogan: "",
    logoUrl: "", urunResmi: "", icerikMetni: "",
    // Yeni Banka Ayarları
    bankaAdi: "", iban: "", aliciAdi: ""
  });
  
  // LİSTELER
  const [bekleyenler, setBekleyenler] = useState([]);
  const [bagislar, setBagislar] = useState([]); // Manuel ekleme/çıkarma için
  
  // MANUEL EKLEME FORMU
  const [manuelForm, setManuelForm] = useState({ isim: "", adet: 1 });
  
  // YÜKLEME DURUMLARI
  const [yukleniyor, setYukleniyor] = useState(false);
  const [resimYukleniyor, setResimYukleniyor] = useState(false);

  // ONAYLAMA İÇİN
  const [onayIsmi, setOnayIsmi] = useState("");
  const [seciliBekleyen, setSeciliBekleyen] = useState(null);

  useEffect(() => { 
      verileriGetir(); 
      bekleyenleriGetir(); 
      bagislariGetir(); 
  }, []);

  // --- VERİ ÇEKME FONKSİYONLARI ---
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
    // Tarihe göre sırala (Yeniler üstte)
    const veri = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  // --- WHATSAPP LİNK DÜZELTİCİ ---
  const whatsappAc = (telefon, mesaj) => {
    // 1. Telefondaki boşlukları, parantezleri temizle
    let temizNo = telefon.replace(/\D/g, ''); 
    // 2. Başında 0 varsa sil (555...)
    if (temizNo.startsWith('0')) temizNo = temizNo.substring(1);
    // 3. Başında 90 yoksa ekle
    if (!temizNo.startsWith('90')) temizNo = '90' + temizNo;

    // Linki aç
    const url = `https://wa.me/${temizNo}?text=${encodeURIComponent(mesaj)}`;
    window.open(url, '_blank');
  };

  // --- ONAYLAMA SİSTEMİ ---
  const bagisiOnayla = async (bekleyen) => {
    if(!onayIsmi) return alert("Lütfen listede görünecek ismi yazın.");

    // 1. Gerçek listeye ekle
    await addDoc(collection(db, "bagislar"), {
        isim: onayIsmi,
        adet: Number(bekleyen.adet),
        tarih: new Date().toISOString()
    });

    // 2. Toplanan sayıyı güncelle
    const yeniToplanan = Number(form.toplananSayi) + Number(bekleyen.adet);
    setForm(prev => ({ ...prev, toplananSayi: yeniToplanan }));
    await updateDoc(doc(db, "ayarlar", "genel"), { toplananSayi: yeniToplanan });

    // 3. Bekleyenlerden sil
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
    if(!confirm("Reddetmek istediğine emin misin?")) return;
    await deleteDoc(doc(db, "bekleyen_bagislar", id));
    
    const mesaj = `Merhaba, yaptığınız bağış bildirimini kontrollerimizde göremedik. Lütfen tekrar kontrol edip bildiriniz.`;
    whatsappAc(telefon, mesaj);
    
    bekleyenleriGetir();
  };

  // --- MANUEL EKLEME/SİLME ---
  const manuelEkle = async () => {
      if(!manuelForm.isim) return alert("İsim yazın");
      await addDoc(collection(db, "bagislar"), {
          isim: manuelForm.isim, adet: Number(manuelForm.adet), tarih: new Date().toISOString()
      });
      // Sayıyı arttır
      const yeniToplanan = Number(form.toplananSayi) + Number(manuelForm.adet);
      setForm(prev => ({...prev, toplananSayi: yeniToplanan}));
      await updateDoc(doc(db, "ayarlar", "genel"), { toplananSayi: yeniToplanan });
      
      setManuelForm({isim: "", adet: 1});
      bagislariGetir();
      alert("Manuel eklendi");
  };

  const manuelSil = async (id, adet) => {
      if(!confirm("Silmek istiyor musun?")) return;
      await deleteDoc(doc(db, "bagislar", id));
      // Sayıyı düşür
      const yeniToplanan = Number(form.toplananSayi) - Number(adet);
      setForm(prev => ({...prev, toplananSayi: yeniToplanan}));
      await updateDoc(doc(db, "ayarlar", "genel"), { toplananSayi: yeniToplanan });
      bagislariGetir();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <h1 className="text-3xl font-bold text-center mb-8 text-amber-800">YÖNETİCİ PANELİ</h1>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SOL KOLON: AYARLAR */}
        <div className="space-y-6">
            
            {/* 1. BANKA AYARLARI */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500 space-y-3">
                <h2 className="font-bold text-blue-700 text-lg">Banka Bilgileri</h2>
                <input type="text" placeholder="Banka Adı" className="w-full p-2 border rounded" value={form.bankaAdi || ""} onChange={(e) => setForm({...form, bankaAdi: e.target.value})} />
                <input type="text" placeholder="Alıcı Adı Soyadı" className="w-full p-2 border rounded" value={form.aliciAdi || ""} onChange={(e) => setForm({...form, aliciAdi: e.target.value})} />
                <input type="text" placeholder="IBAN (TR...)" className="w-full p-2 border rounded" value={form.iban || ""} onChange={(e) => setForm({...form, iban: e.target.value})} />
            </div>

            {/* 2. GÖRSEL AYARLARI (LOGO & RESİM) */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-amber-500 space-y-3">
                <h2 className="font-bold text-amber-700 text-lg">Görseller</h2>
                
                <div className="flex items-center gap-4 border p-2 rounded bg-gray-50">
                    <div className="w-16 h-16 bg-white border flex items-center justify-center">
                        {form.logoUrl ? <img src={form.logoUrl} className="max-h-14 object-contain"/> : <span className="text-xs">Yok</span>}
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold block mb-1">LOGO YÜKLE</label>
                        <input type="file" onChange={(e) => dosyaOku(e, 'logoUrl')} className="text-sm w-full"/>
                    </div>
                </div>

                <div className="flex items-center gap-4 border p-2 rounded bg-gray-50">
                    <div className="w-16 h-16 bg-white border flex items-center justify-center">
                        {form.urunResmi ? <img src={form.urunResmi} className="max-h-14 object-contain"/> : <span className="text-xs">Yok</span>}
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold block mb-1">KUMANYA RESMİ YÜKLE</label>
                        <input type="file" onChange={(e) => dosyaOku(e, 'urunResmi')} className="text-sm w-full"/>
                    </div>
                </div>
            </div>

            {/* 3. METİN AYARLARI */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-gray-500 space-y-3">
                <h2 className="font-bold text-gray-700 text-lg">Yazılar & Rakamlar</h2>
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
                    <label className="text-xs font-bold">Paket İçeriği (Ürün : Miktar)</label>
                    <textarea rows="5" className="w-full p-2 border rounded font-mono text-sm" value={form.icerikMetni} onChange={(e) => setForm({...form, icerikMetni: e.target.value})}></textarea>
                </div>

                <button onClick={ayarlariGuncelle} disabled={resimYukleniyor} className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 text-lg">
                    {resimYukleniyor ? "Resim İşleniyor..." : "KAYDET"}
                </button>
            </div>
        </div>

        {/* SAĞ KOLON: İŞLEMLER */}
        <div className="space-y-6">
            
            {/* 1. ONAY BEKLEYENLER */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-red-500 min-h-[300px]">
                <h2 className="text-xl font-bold text-red-600 border-b pb-2 mb-4 flex justify-between">
                    Onay Bekleyenler 
                    <span className="bg-red-100 px-3 rounded-full">{bekleyenler.length}</span>
                </h2>

                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {bekleyenler.length === 0 && <p className="text-gray-400 text-sm">Bekleyen işlem yok.</p>}
                    {bekleyenler.map((b) => (
                        <div key={b.id} className="bg-red-50 p-3 rounded border border-red-100">
                            <div className="flex justify-between font-bold text-gray-800">
                                <span>{b.adSoyad}</span>
                                <span className="text-red-600">{b.adet} Adet</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">{b.telefon} | {new Date(b.tarih).toLocaleDateString()}</div>
                            
                            {seciliBekleyen === b.id ? (
                                <div className="bg-white p-2 rounded border animate-in fade-in">
                                    <input 
                                        type="text" 
                                        placeholder="Listede görünecek isim" 
                                        className="w-full p-2 border rounded mb-2 text-sm"
                                        value={onayIsmi}
                                        onChange={(e) => setOnayIsmi(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => bagisiOnayla(b)} className="flex-1 bg-green-600 text-white py-1 rounded text-sm hover:bg-green-700">ONAYLA</button>
                                        <button onClick={() => setSeciliBekleyen(null)} className="px-3 bg-gray-300 rounded text-sm">İptal</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => { setSeciliBekleyen(b.id); setOnayIsmi(b.adSoyad); }} className="flex-1 bg-blue-600 text-white py-1.5 rounded text-sm font-bold hover:bg-blue-700">İNCELE</button>
                                    <button onClick={() => bagisiReddet(b.id, b.telefon)} className="px-3 bg-white border border-red-300 text-red-500 rounded text-xs font-bold hover:bg-red-50">RED</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. MANUEL EKLEME & LİSTE */}
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
                <h2 className="text-xl font-bold text-green-700 border-b pb-2 mb-4">Aktif Bağışçı Listesi</h2>
                
                <div className="flex gap-2 mb-4 bg-green-50 p-2 rounded">
                    <input type="text" placeholder="İsim" className="flex-1 p-2 border rounded" value={manuelForm.isim} onChange={(e) => setManuelForm({...manuelForm, isim: e.target.value})} />
                    <input type="number" placeholder="Adet" className="w-16 p-2 border rounded text-center" value={manuelForm.adet} onChange={(e) => setManuelForm({...manuelForm, adet: e.target.value})} />
                    <button onClick={manuelEkle} className="bg-green-600 text-white px-4 rounded font-bold hover:bg-green-700">+</button>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-1">
                    {bagislar.map((b) => (
                        <div key={b.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 border-b">
                            <span>{b.isim} <span className="font-bold text-green-600">({b.adet})</span></span>
                            <button onClick={() => manuelSil(b.id, b.adet)} className="text-red-500 text-xs hover:underline">Sil</button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}