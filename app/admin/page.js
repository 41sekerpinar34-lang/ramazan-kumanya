// app/admin/page.js
"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";

export default function Admin() {
  const [form, setForm] = useState({
    toplananSayi: 0, hedefSayi: 0, birimFiyat: 0, slogan: "",
    logoUrl: "", urunResmi: "", icerikMetni: ""
  });
  const [bagisForm, setBagisForm] = useState({ isim: "", adet: 1 });
  const [bagislar, setBagislar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { verileriGetir(); bagislariGetir(); }, []);

  const verileriGetir = async () => {
    const docSnap = await getDoc(doc(db, "ayarlar", "genel"));
    if (docSnap.exists()) setForm(docSnap.data());
  };

  const bagislariGetir = async () => {
    const q = await getDocs(collection(db, "bagislar"));
    setBagislar(q.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // RESMİ METNE ÇEVİRME FONKSİYONU (Base64)
  const dosyaOku = (e, alanAdi) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { alert("Lütfen 1MB'dan küçük bir resim seçiniz."); return; }
    setYukleniyor(true);
    const reader = new FileReader();
    reader.onloadend = () => {
        setForm(prev => ({ ...prev, [alanAdi]: reader.result }));
        setYukleniyor(false);
    };
    reader.readAsDataURL(file);
  };

  const ayarlariGuncelle = async () => {
    try {
        await updateDoc(doc(db, "ayarlar", "genel"), {
            ...form,
            toplananSayi: Number(form.toplananSayi),
            hedefSayi: Number(form.hedefSayi),
            birimFiyat: Number(form.birimFiyat)
        });
        alert("✅ Ayarlar ve Resimler Kaydedildi!");
    } catch (error) { console.error("Hata:", error); alert("Kaydederken hata oluştu."); }
  };

  const bagisEkle = async () => {
    await addDoc(collection(db, "bagislar"), {
      isim: bagisForm.isim, adet: Number(bagisForm.adet), tarih: new Date().toISOString()
    });
    const yeniToplanan = Number(form.toplananSayi) + Number(bagisForm.adet);
    setForm(prev => ({ ...prev, toplananSayi: yeniToplanan }));
    await updateDoc(doc(db, "ayarlar", "genel"), { toplananSayi: yeniToplanan });
    setBagisForm({ isim: "", adet: 1 });
    bagislariGetir();
  };

  const bagisSil = async (id, adet) => {
      if(!confirm("Silinsin mi?")) return;
      await deleteDoc(doc(db, "bagislar", id));
      const yeniToplanan = Number(form.toplananSayi) - Number(adet);
      setForm(prev => ({ ...prev, toplananSayi: yeniToplanan }));
      await updateDoc(doc(db, "ayarlar", "genel"), { toplananSayi: yeniToplanan });
      bagislariGetir();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AYARLAR */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 space-y-5">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Afiş Düzenle</h2>
          
          {/* Logo Yükle */}
          <div className="bg-blue-50/50 p-4 rounded-lg border border-dashed border-blue-200">
            <label className="block text-xs font-bold text-blue-800 mb-2">KURUM LOGOSU</label>
            <div className="flex items-center gap-4">
                {form.logoUrl ? (<img src={form.logoUrl} className="h-12 w-auto object-contain bg-white rounded border shadow-sm" />) : <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs">Yok</div>}
                <input type="file" accept="image/*" onChange={(e) => dosyaOku(e, 'logoUrl')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"/>
            </div>
          </div>

          {/* Ürün Resmi Yükle */}
          <div className="bg-amber-50/50 p-4 rounded-lg border border-dashed border-amber-200">
            <label className="block text-xs font-bold text-amber-800 mb-2">KUMANYA RESMİ</label>
            <div className="flex items-center gap-4">
                {form.urunResmi ? (<img src={form.urunResmi} className="h-16 w-auto object-contain bg-white rounded border shadow-sm" />) : <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-xs">Yok</div>}
                <input type="file" accept="image/*" onChange={(e) => dosyaOku(e, 'urunResmi')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"/>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <div><label className="text-xs font-bold text-gray-500">Toplanan</label><input type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={form.toplananSayi} onChange={(e) => setForm({...form, toplananSayi: e.target.value})} /></div>
             <div><label className="text-xs font-bold text-gray-500">Hedef</label><input type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={form.hedefSayi} onChange={(e) => setForm({...form, hedefSayi: e.target.value})} /></div>
             <div><label className="text-xs font-bold text-gray-500">Fiyat (TL)</label><input type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={form.birimFiyat} onChange={(e) => setForm({...form, birimFiyat: e.target.value})} /></div>
          </div>
          
          {/* SLOGANLAR - ARTIK TEXTAREA */}
          <div>
            <label className="text-xs font-bold text-gray-500">Sloganlar (Alt alta yaz)</label>
            <textarea rows="3" className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none font-medium" value={form.slogan} onChange={(e) => setForm({...form, slogan: e.target.value})} placeholder="Bir Ailenin Sofrasına Ortak Ol&#10;Ramazan Paylaşmaktır"></textarea>
          </div>

          <div>
            <label className="text-xs font-bold text-amber-700">İçerik Listesi</label>
            <p className="text-[10px] text-gray-400 mb-1">Format: <span className="font-mono bg-gray-100 px-1">Ürün : Miktar</span></p>
            <textarea rows="6" className="w-full p-2 border rounded font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none" value={form.icerikMetni || ""} onChange={(e) => setForm({...form, icerikMetni: e.target.value})}></textarea>
          </div>

          <button onClick={ayarlariGuncelle} disabled={yukleniyor} className="w-full bg-amber-600 text-white p-3 rounded-lg font-bold hover:bg-amber-700 disabled:opacity-50 transition shadow-lg">
            {yukleniyor ? "Resim İşleniyor..." : "AYARLARI KAYDET"}
          </button>
        </div>

        {/* BAĞIŞÇILAR */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 h-fit">
          <h2 className="text-xl font-bold text-green-700 border-b pb-2 mb-4">Bağış Girişi</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="İsim Soyisim" className="flex-1 p-2 border rounded" value={bagisForm.isim} onChange={(e) => setBagisForm({...bagisForm, isim: e.target.value})} />
            <input type="number" placeholder="Adet" className="w-20 p-2 border rounded" value={bagisForm.adet} onChange={(e) => setBagisForm({...bagisForm, adet: e.target.value})} />
          </div>
          <button onClick={bagisEkle} className="w-full bg-green-600 text-white p-2 rounded-lg font-bold hover:bg-green-700 mb-4 transition">+ LİSTEYE EKLE</button>
          
          <div className="max-h-[500px] overflow-y-auto space-y-2 border-t pt-2">
            {bagislar.map((b) => (
                <div key={b.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border text-sm hover:bg-gray-100 transition">
                    <span>{b.isim} <span className="font-bold text-green-600">({b.adet})</span></span>
                    <button onClick={() => bagisSil(b.id, b.adet)} className="text-red-500 text-xs font-bold hover:underline px-2">SİL</button>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}