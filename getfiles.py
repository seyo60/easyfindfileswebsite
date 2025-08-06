from supabase import create_client, Client
import os
from typing import Optional, List, Dict, Any

class SupabaseModel:
    def __init__(self):
        # Supabase bağlantı bilgileri
        self.url: str = os.getenv("SUPABASE_URL", "https://ggaefqvwehljoqtgnzrx.supabase.co")
        self.key: str = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnYWVmcXZ3ZWhsam9xdGduenJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTUwODIsImV4cCI6MjA2OTQzMTA4Mn0.t_EPI2kUwxjY188Jh9sfFHITEwqPCj_eaAGpq_O72_w")
        
        # İstemci oluştur
        self.client: Client = create_client(self.url, self.key)
    
    def get_all(self, table_name: str) -> List[Dict[str, Any]]:
        """Belirtilen tablodaki tüm verileri getir"""
        response = self.client.table(table_name).select("*").execute()
        return response.data
    
    def get_by_id(self, table_name: str, id: int) -> Optional[Dict[str, Any]]:
        """ID'ye göre tek bir kayıt getirir"""
        response = self.client.table(table_name).select("*").eq("id", id).execute()
        return response.data[0] if response.data else None
    
