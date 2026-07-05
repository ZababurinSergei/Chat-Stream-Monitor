#!/bin/bash
# test-connection.sh - Тест подключения к MQTT брокеру

echo "═══════════════════════════════════════════════════════════════"
echo "  MQTT Connection Test"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Проверка 1: DNS
echo "📍 Test 1: DNS Resolution"
echo "  mqtt.onemesh.ru -> $(dig +short mqtt.onemesh.ru | head -1)"
echo ""

# Проверка 2: Порт
echo "📍 Test 2: Port Check"
if nc -zv mqtt.onemesh.ru 1883 2>&1 | grep -q "succeeded"; then
    echo "  ✅ Port 1883 is open"
else
    echo "  ❌ Port 1883 is closed"
fi
echo ""

# Проверка 3: Библиотеки
echo "📍 Test 3: Libraries"
if ldconfig -p | grep -q paho; then
    echo "  ✅ Paho MQTT library found"
else
    echo "  ❌ Paho MQTT library NOT found"
fi
echo ""

# Проверка 4: Подключение через программу
echo "📍 Test 4: Program Connection"
echo "  Running: ./bin/mtproto-mqtt-gateway --test-connect"
echo ""

./bin/mtproto-mqtt-gateway --test-connect

echo ""
echo "═══════════════════════════════════════════════════════════════"