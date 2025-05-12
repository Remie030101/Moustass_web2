#!/bin/bash

# Configuration
URL="http://localhost"
CONCURRENT_USERS=100
TOTAL_REQUESTS=1000
TEST_DURATION=30

echo "=== Test de charge avec Apache Benchmark ==="
echo "URL: $URL"
echo "Utilisateurs concurrents: $CONCURRENT_USERS"
echo "Nombre total de requêtes: $TOTAL_REQUESTS"
echo "Durée du test: $TEST_DURATION secondes"
echo ""

# Test de la page d'accueil
echo "Test de la page d'accueil:"
ab -n $TOTAL_REQUESTS -c $CONCURRENT_USERS -t $TEST_DURATION $URL/

# Test de l'API de login
echo -e "\nTest de l'API de login:"
ab -n $TOTAL_REQUESTS -c $CONCURRENT_USERS -t $TEST_DURATION \
   -p data/login.json -T 'application/json' \
   $URL/api/auth/login

# Test de l'API de messages
echo -e "\nTest de l'API de messages:"
ab -n $TOTAL_REQUESTS -c $CONCURRENT_USERS -t $TEST_DURATION \
   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
   $URL/api/messages 