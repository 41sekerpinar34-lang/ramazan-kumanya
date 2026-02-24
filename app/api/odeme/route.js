// app/api/odeme/route.js
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { adSoyad, telefon, adet, birimFiyat } = body;

        // Tutarı hesapla ve bankanın istediği formata (Örn: 2000.00) çevir
        const toplamTutar = (Number(adet) * Number(birimFiyat)).toFixed(2);

        // Güvenli kasadan şifreleri al
        const sx = process.env.PAYNKOLAY_SX;
        const merchantSecretKey = process.env.PAYNKOLAY_SECRET_KEY;

        if (!sx || !merchantSecretKey) {
            return NextResponse.json({ error: "Banka şifreleri eksik (env dosyasını kontrol edin)." }, { status: 500 });
        }

        // Bankanın istediği parametreler
        const clientRefCode = "RMZN" + Date.now(); // Benzersiz sipariş no
        const successUrl = "https://ramazan-kumanya.vercel.app/?durum=basarili";
        const failUrl = "https://ramazan-kumanya.vercel.app/?durum=hata";
        const rnd = Date.now().toString();
        const customerKey = ""; // Kayıtlı kart yoksa boş

        // Postman'deki SHA512 Güvenlik Algoritması (Hash oluşturma)
        const hashString = `${sx}|${clientRefCode}|${toplamTutar}|${successUrl}|${failUrl}|${rnd}|${customerKey}|${merchantSecretKey}`;
        const hashDatav2 = crypto.createHash('sha512').update(hashString).digest('base64');

        // Bankaya gönderilecek veriyi paketle
        const formData = new URLSearchParams();
        formData.append('sx', sx);
        formData.append('clientRefCode', clientRefCode);
        formData.append('amount', toplamTutar);
        formData.append('successUrl', successUrl);
        formData.append('failUrl', failUrl);
        formData.append('rnd', rnd);
        formData.append('use3D', 'true'); // 3D Secure Zorunlu
        formData.append('currencyCode', '949'); // TL Kodu
        formData.append('transactionType', 'SALES');
        formData.append('hashDatav2', hashDatav2);
        formData.append('detail', 'true');
        formData.append('inputNamesurname', adSoyad);
        formData.append('inputPhone', telefon);

        // Paynkolay'a Bağlan (Canlı Ortam URL)
        const response = await fetch("https://paynkolay.nkolayislem.com.tr/Vpos/by-link-create", {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        // Bankadan gelen cevabı oku ve ön yüze gönder
        const result = await response.json();
        return NextResponse.json(result);

    } catch (error) {
        console.error("API Hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
    }
}