# Создаем патч с исправлением
cat > apply/fix_connect_options.patch << 'EOF'
--- a/src/mesh-mqtt.c
+++ b/src/mesh-mqtt.c
@@ -397,12 +397,9 @@
         return -1;
     }

-    // 🔥 ПОЛНАЯ ИНИЦИАЛИЗАЦИЯ структуры
-    MQTTClient_connectOptions conn_opts;
-    memset(&conn_opts, 0, sizeof(conn_opts));
-    strcpy(conn_opts.struct_id, "MQTC");
-    conn_opts.struct_version = 0;
-    // MQTTClient_SSLOptions ssl_opts = MQTTClient_SSLOptions_initializer;
+    // 🔥 ИСПОЛЬЗУЕМ ИНИЦИАЛИЗАТОР
+    MQTTClient_connectOptions conn_opts = MQTTClient_connectOptions_initializer;
+    // MQTTClient_SSLOptions ssl_opts = MQTTClient_SSLOptions_initializer;

     // 🔥 Проверяем структуру
     log_message("DEBUG", "conn_opts struct_id: %.4s, version: %d",
EOF

# Применяем патч
patch -p1 < apply/fix_connect_options.patch

# Пересобираем
./rebuild.sh --no-test

# Проверяем тест подключения
./bin/mtproto-mqtt-gateway --test-connect
