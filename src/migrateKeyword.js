// migrateKeywords.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://ggaefqvwehljoqtgnzrx.supabase.co",
  "YOUR_SUPABASE_KEY"
);

function normalizeKeyword(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[ı]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[_\-\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function migrateKeywords() {
  // Tüm keyword'leri çek
  const { data: keywords, error } = await supabase
    .from('keywords')
    .select('id, keyword');

  if (error) throw error;

  // Her bir keyword için normalize edilmiş versiyonu güncelle
  for (const row of keywords) {
    const normalized = normalizeKeyword(row.keyword);
    await supabase
      .from('keywords')
      .update({ normalized_keyword: normalized })
      .eq('id', row.id);
  }

  console.log(`Toplam ${keywords.length} keyword güncellendi`);
}

migrateKeywords();