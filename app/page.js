// app/page.js
"use client";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { Share2, CreditCard, ShoppingBag, PackageCheck } from "lucide-react";

export default function Home() {
  const [data, setData] = useState(null);
  const [bagislar, setBagislar] = useState([]);
  const [toplamBagisciSayisi, setToplamBagisciSayisi] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ayarDinle = onSnapshot(doc(db, "ayarlar", "genel"), (doc) => {
      setData(doc.data());
      setLoading(false);
    });
    const bagisDinle = onSnapshot(collection(db, "bagislar"), (snap) => {
        const liste = snap.docs.map(d => d.data());
        liste.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
        setBagislar(liste.slice(0, 5));
        setToplamBagisciSayisi(liste.length);
    });
    return () => { ayarDinle(); bagisDinle(); };
  }, []);

  if (loading || !data) return <div className="h-screen flex items-center justify-center bg-[#fdfbf7] text-amber-800 font-bold animate-pulse text-lg">Yükleniyor...</div>;

  const yuzde = data.hedefSayi > 0 ? Math.min(((data.toplananSayi / data.hedefSayi) * 100).toFixed(1), 100) : 0;
  const icerikListesi = data.icerikMetni ? data.icerikMetni.split('\n') : [];
  const sloganListesi = data.slogan ? data.slogan.split('\n') : [];
  const kalanBagisci = toplamBagisciSayisi - 5;

  return (
    <div className="min-h-screen bg-[#ebe7e0] flex items-center justify-center p-0 md:p-4 font-sans text-gray-800">
      
      {/* ANA KART */}
      <div className="w-full max-w-[1000px] bg-white shadow-2xl md:rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[650px] border border-white/50">
        
        {/* === SOL TARAF (Görsel Alanı) === */}
        <div className="w-full md:w-5/12 bg-gradient-to-b from-amber-100 via-amber-50 to-white p-6 md:p-8 flex flex-col relative border-b md:border-b-0 md:border-r border-amber-100/80">
          
          {/* LOGO & BAŞLIK & SLOGANLAR */}
          <div className="text-center mb-2 z-10 relative">
             {data.logoUrl && <img src={data.logoUrl} alt="Logo" className="w-auto h-32 md:h-40 mx-auto object-contain drop-shadow-md transform hover:scale-105 transition duration-500" />}
             
             <h1 className="text-3xl font-serif font-black text-amber-900 leading-none mt-4 mb-2 drop-shadow-sm">RAMAZAN<br/>KUMANYASI</h1>
             
             <div className="space-y-1">
                {sloganListesi.map((slg, index) => (
                    <p key={index} className="text-amber-800 text-sm font-medium italic relative inline-block px-4">
                        {slg}
                    </p>
                ))}
             </div>
          </div>

          {/* ÜRÜN & FİYAT */}
          <div className="flex-shrink-0 flex items-center justify-center relative mt-4 mb-8 group z-10">
             <div className="absolute inset-0 bg-amber-400 rounded-full blur-[60px] opacity-20 scale-75 group-hover:scale-90 transition duration-700"></div>
             
             {/* FİYAT (Sağ üst köşe, eğimli) */}
             <div className="absolute top-0 right-2 bg-gradient-to-br from-red-600 to-red-800 text-white px-4 py-2 rounded-xl shadow-xl rotate-12 z-20 border-2 border-white/30 transform group-hover:rotate-6 transition">
                <span className="text-[10px] font-bold opacity-90 block text-center tracking-widest leading-tight">BİRİM<br/>BEDELİ</span>
                <span className="text-2xl font-black leading-none">{data.birimFiyat}<span className="text-sm align-top">₺</span></span>
             </div>
             
             <img 
               src={data.urunResmi || "https://cdn-icons-png.flaticon.com/512/679/679821.png"} 
               className="w-64 md:w-72 object-contain relative z-10 drop-shadow-2xl hover:scale-105 transition duration-500" 
             />
          </div>

          {/* PROGRESS BAR KUTUSU (YUKARI TAŞINDI & MEĞİRLİ KUTU) */}
          <div className="relative z-20 -mt-6 mx-2">
             {/* Kutunun kendisi */}
             <div className="bg-white p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-amber-100 relative overflow-hidden transform hover:-translate-y-1 transition duration-300">
                
                {/* Dekoratif Arka Plan Deseni */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-full opacity-50"></div>

                <div className="flex justify-between text-xs font-bold text-amber-900/70 uppercase mb-2 tracking-wider px-1 relative z-10">
                    <span>Hedefe Ulaşım</span>
                    <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded">%{yuzde}</span>
                </div>

                {/* Bar */}
                <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden mb-4 shadow-inner relative ring-1 ring-gray-200 z-10">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-5 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(245,158,11,0.4)] relative overflow-hidden" style={{ width: `${yuzde}%` }}>
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse-slow"></div>
                    </div>
                </div>

                {/* İstatistikler */}
                <div className="flex justify-between text-center divide-x divide-gray-100 relative z-10">
                    <div className="w-1/2 pr-2">
                        <span className="block text-2xl font-black text-amber-900 leading-none">{data.toplananSayi}</span>
                        <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wide">Toplanan Koli</span>
                    </div>
                    <div className="w-1/2 pl-2">
                        <span className="block text-2xl font-black text-gray-300 leading-none">{data.hedefSayi}</span>
                        <span className="text-[9px] font-bold uppercase text-gray-300 tracking-wide">Hedeflenen</span>
                    </div>
                </div>
             </div>
          </div>

        </div>

        {/* === SAĞ TARAF (İçerik & Liste & Butonlar) === */}
        <div className="w-full md:w-7/12 p-6 md:p-8 bg-white flex flex-col relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-bl-full opacity-50 pointer-events-none"></div>
          
          {/* MENÜ LİSTESİ */}
          <div className="mb-6 relative z-10">
            <h3 className="flex items-center gap-2 font-bold text-amber-900 pb-3 mb-4 uppercase text-sm tracking-wider">
                <ShoppingBag size={18} className="text-amber-500" /> Paket İçeriği
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {icerikListesi.map((item, index) => {
                    const parts = item.split(':');
                    const urun = parts[0]?.trim() || item;
                    const gramaj = parts[1]?.trim() || "";

                    return (
                        <div key={index} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-amber-200 transition-colors group shadow-sm">
                            <span className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                                <PackageCheck size={16} className="text-amber-400/70 group-hover:text-amber-500 transition-colors" />
                                {urun}
                            </span>
                            {gramaj && <span className="font-bold text-gray-900 bg-white px-2.5 py-1 rounded-md text-xs border border-gray-200 shadow-sm whitespace-nowrap">{gramaj}</span>}
                        </div>
                    )
                })}
            </div>
          </div>

          {/* BAĞIŞÇILAR */}
          <div className="flex-1 flex flex-col mb-6 bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4 border border-gray-100 relative z-10">
             <h3 className="font-bold text-gray-500 mb-3 uppercase text-xs tracking-wider text-center flex items-center justify-center gap-2">
                Son Destekler
            </h3>
            <div className="space-y-2.5 mb-auto">
                {bagislar.map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">
                                {b.isim.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-gray-700 line-clamp-1">{b.isim}</span>
                        </div>
                        <span className="text-xs font-extrabold bg-green-100/50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200/50 shadow-sm">{b.adet} Paket</span>
                    </div>
                ))}
                {bagislar.length === 0 && <p className="text-center text-gray-400 text-sm italic py-4">İlk desteği sen ver!</p>}
            </div>
            
            {kalanBagisci > 0 && (
                <p className="text-center text-xs font-medium text-gray-500 mt-3 bg-gray-100/50 py-2 rounded-lg">
                    ...ve <span className="font-bold text-amber-700">{kalanBagisci} hayırsever</span> daha destek oldu.
                </p>
            )}
          </div>

          {/* BUTONLAR */}
          <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
             <button className="bg-gradient-to-tr from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-200/50 flex items-center justify-center gap-2 transition transform active:scale-[0.98] group overflow-hidden relative">
               <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition duration-700"></div>
               <CreditCard size={20} /> 
               BAĞIŞ YAP
             </button>
             <button 
                onClick={() => navigator.share ? navigator.share({title:'Ramazan Kumanyası', url:window.location.href}) : alert("Link kopyalandı!")}
                className="bg-white border-2 border-gray-200 hover:border-amber-400 text-gray-700 hover:text-amber-700 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition transform active:scale-[0.98] shadow-sm hover:shadow-md"
             >
               <Share2 size={20} /> 
               PAYLAŞ
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}