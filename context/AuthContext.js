import React, { createContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = cargando, null = no hay sesión
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Obtener sesión actual al arrancar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) setUserProfile(data);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  if (user === undefined) return null; // cargando

  return (
    <AuthContext.Provider value={{ user, userProfile, loadProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}