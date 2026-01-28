// app/admin/page.js
"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; // Dosya yoluna dikkat
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";

export default function Admin() {
  const [form, setForm] = useState({
    toplananSayi: 0, hedefSayi: 0, birimFiyat: 0, slogan: "",
    logoUrl: "", urunResmi: "", icerikMetni: "",
    // YENİ EKLENEN BANKA AYARLARI
    bankaAdi: "", iban: "", aliciAdi: "", adminEmail: ""
  });
  
  const [bekleyenler, setBekleyenler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Onaylama işlemi için geçici state
  const [onayIsmi, setOnayIsmi] = useState("");
  const [seciliBekleyen, setSeciliBekleyen] = useState(null);

  useEffect(() => { verileriGetir(); bekleyenleriGetir(); }, []);

  const verileriGetir = async () => {
    const docSnap = await getDoc(doc(db, "ayarlar", "genel"));
    if (docSnap.exists()) setForm(docSnap.data());
  };

  const bekleyenleriGetir = async () => {
    const q = await getDocs(collection(db, "bekleyen_bagislar"));
    setBekleyenler(q.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const ayarlariGuncelle = async () => {
    await updateDoc(doc(db, "ayarlar", "genel"), form);
    alert("✅ Ayarlar Kaydedildi!");
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

    // 2. Toplanan sayıyı arttır
    const yeniToplanan = Number(form.toplananSayi) + Number(bekleyen.adet);
    await updateDoc(doc(db, "ayarlar", "genel"), { toplananSayi: yeniToplanan });
    setForm(prev => ({ ...prev, toplananSayi: yeniToplanan }));

    // 3. Bekleyenlerden sil
    await deleteDoc(doc(db, "bekleyen_bagislar", bekleyen.id));

    // 4. WhatsApp Mesajı Aç
    const mesaj = `Merhaba, ${bekleyen.adet} adet kumanya bağışınız tarafımıza ulaşmıştır. Allah kabul etsin. Destekleriniz için teşekkür ederiz.`;
    window.open(`https://wa.me/${bekleyen.telefon}?text=${encodeURIComponent(mesaj)}`, '_blank');

    setSeciliBekleyen(null);
    setOnayIsmi("");
    bekleyenleriGetir();
    alert("✅ Bağış Onaylandı ve Listeye Eklendi!");
  };

  const bagisiReddet = async (id, telefon) => {
    if(!confirm("Bu bildirimi silmek ve 'Bağış gelmedi' mesajı atmak istiyor musun?")) return;
    
    await deleteDoc(doc(db, "bekleyen_bagislar", id));
    
    // Red Mesajı
    const mesaj = `Merhaba, yaptığınız bağış bildirimini kontrol ettik ancak hesaplarımızda göremedik. Lütfen kontrol edip tekrar deneyiniz.`;
    window.open(`https://wa.me/${telefon}?text=${encodeURIComponent(mesaj)}`, '_blank');
    
    bekleyenleriGetir();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SOL: AYARLAR & BANKA */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Banka & İletişim Ayarları</h2>
                <div><label className="text-xs font-bold">Banka Adı</label><input type="text" className="w-full p-2 border rounded" value={form.bankaAdi || ""} onChange={(e) => setForm({...form, bankaAdi: e.target.value})} /></div>
                <div><label className="text-xs font-bold">IBAN (TR ile başla)</label><input type="text" className="w-full p-2 border rounded" value={form.iban || ""} onChange={(e) => setForm({...form, iban: e.target.value})} /></div>
                <div><label className="text-xs font-bold">Alıcı Adı Soyadı</label><input type="text" className="w-full p-2 border rounded" value={form.aliciAdi || ""} onChange={(e) => setForm({...form, aliciAdi: e.target.value})} /></div>
                <div><label className="text-xs font-bold">Bildirim Emailiniz</label><input type="email" className="w-full p-2 border rounded" value={form.adminEmail || ""} onChange={(e) => setForm({...form, adminEmail: e.target.value})} /></div>
                <button onClick={ayarlariGuncelle} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">BANKA BİLGİLERİNİ KAYDET</button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow space-y-4">
               <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Genel Ayarlar</h2>
               {/* Eski ayarların aynısı */}
               <div className="grid grid-cols-2 gap-2">
                 <div><label className="text-xs font-bold">Toplanan</label><input type="number" className="w-full p-2 border rounded" value={form.toplananSayi} onChange={(e) => setForm({...form, toplananSayi: e.target.value})} /></div>
                 <div><label className="text-xs font-bold">Hedef</label><input type="number" className="w-full p-2 border rounded" value={form.hedefSayi} onChange={(e) => setForm({...form, hedefSayi: e.target.value})} /></div>
               </div>
               <div><label className="text-xs font-bold">Sloganlar</label><textarea rows="3" className="w-full p-2 border rounded" value={form.slogan} onChange={(e) => setForm({...form, slogan: e.target.value})}></textarea></div>
               <button onClick={ayarlariGuncelle} className="w-full bg-amber-600 text-white p-3 rounded font-bold hover:bg-amber-700">TÜM AYARLARI KAYDET</button>
            </div>
        </div>

        {/* SAĞ: ONAY BEKLEYENLER */}
        <div className="bg-white p-6 rounded-xl shadow h-fit min-h-[500px]">
            <h2 className="text-xl font-bold text-red-600 border-b pb-2 mb-4 flex justify-between">
                Onay Bekleyenler 
                <span className="bg-red-100 text-red-600 px-2 rounded-full text-sm">{bekleyenler.length}</span>
            </h2>
            
            {bekleyenler.length === 0 && <p className="text-gray-400 italic">Şu an onay bekleyen yeni bağış yok.</p>}

            <div className="space-y-4">
                {bekleyenler.map((b) => (
                    <div key={b.id} className="border border-red-100 rounded-lg p-4 bg-red-50/50">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-gray-800">{b.adSoyad}</p>
                                <p className="text-xs text-gray-500">{b.telefon}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-xl font-black text-red-600">{b.adet} ADET</span>
                                <span className="text-xs text-gray-400">{new Date(b.tarih).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Onay Kutusu - Sadece seçilince açılır */}
                        {seciliBekleyen === b.id ? (
                            <div className="bg-white p-3 rounded border mt-2">
                                <label className="text-xs font-bold text-gray-500">Listede Görünecek İsim:</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded mb-2 font-bold text-green-700" 
                                    value={onayIsmi} 
                                    onChange={(e) => setOnayIsmi(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => bagisiOnayla(b)} className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">✅ ONAYLA & WHATSAPP</button>
                                    <button onClick={() => setSeciliBekleyen(null)} className="px-3 bg-gray-200 rounded">İptal</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={() => { setSeciliBekleyen(b.id); setOnayIsmi(b.adSoyad); }}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700"
                                >
                                    İNCELE & ONAYLA
                                </button>
                                <button 
                                    onClick={() => bagisiReddet(b.id, b.telefon)}
                                    className="px-4 bg-white border border-red-200 text-red-500 rounded font-bold text-sm hover:bg-red-50"
                                >
                                    REDDET
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}