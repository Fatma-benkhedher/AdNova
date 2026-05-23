package com.example.makerskills.util;

import java.net.InetAddress;
import java.net.Socket;
import java.net.UnknownHostException;

/**
 * Test manuel de la connexion vers Supabase (DNS + port).
 * Exécuter la méthode main pour voir où ça bloque.
 */
public class SupabaseConnectionTest {

    private static final String HOST_DIRECT = "db.ucqwbfvlsstqyxssvwtl.supabase.co";
    private static final String HOST_POOLER = "aws-0-eu-central-1.pooler.supabase.com"; // à adapter si autre région
    private static final int PORT = 5432;

    public static void main(String[] args) {
        System.out.println("=== Test connexion Supabase ===\n");

        // 1. Test DNS (connexion directe)
        System.out.println("1. Résolution DNS (direct): " + HOST_DIRECT);
        try {
            InetAddress addr = InetAddress.getByName(HOST_DIRECT);
            System.out.println("   OK -> " + addr.getHostAddress());
        } catch (UnknownHostException e) {
            System.out.println("   ÉCHEC: " + e.getMessage());
            System.out.println("   → Problème DNS/réseau. Essaye le pooler (étape 2) ou corrige le DNS Windows.");
        }

        // 2. Test DNS (pooler)
        System.out.println("\n2. Résolution DNS (pooler): " + HOST_POOLER);
        try {
            InetAddress addr = InetAddress.getByName(HOST_POOLER);
            System.out.println("   OK -> " + addr.getHostAddress());
        } catch (UnknownHostException e) {
            System.out.println("   ÉCHEC: " + e.getMessage());
        }

        // 3. Test port TCP (si DNS direct OK)
        System.out.println("\n3. Test port TCP " + PORT + " (direct)");
        try (Socket s = new Socket(HOST_DIRECT, PORT)) {
            System.out.println("   OK -> Connexion TCP établie");
        } catch (UnknownHostException e) {
            System.out.println("   ÉCHEC (DNS): " + e.getMessage());
        } catch (Exception e) {
            System.out.println("   ÉCHEC: " + e.getMessage());
            System.out.println("   → Firewall ou port bloqué.");
        }

        System.out.println("\n=== Fin du test ===");
    }
}
