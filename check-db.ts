import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';
import fs from 'fs';

// .env.local dosyasını okuyalım
const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase bilgileri bulunamadı.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Tabloya work_days sütunu ekleniyor...");
  
  // Custom rpc if we had it, but we can just use supabase raw query via postgres 
  // Wait, supabase-js does not support raw queries directly without rpc.
  // Instead, let's just do a simple insert test to see if work_days exists.
  const { error } = await supabase.from('settings').select('work_days').limit(1);
  if (error && error.code === '42703') { // undefined_column
    console.log("Sütun bulunamadı. Lütfen Supabase SQL Editor üzerinden aşağıdaki komutu çalıştırın:");
    console.log("ALTER TABLE settings ADD COLUMN IF NOT EXISTS work_days INTEGER[] DEFAULT '{1,2,3,4,5,6}';");
  } else {
    console.log("Sütun zaten mevcut veya başarıyla okundu!");
  }
}

run();
