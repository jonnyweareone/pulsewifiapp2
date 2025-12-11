#!/bin/bash
# OneSignal Configuration Script for Pulse WiFi PWA
# Run this script with your Organization API Key to configure web push

# Configuration
APP_ID="728b062b-7ac8-41fd-97b1-1fa92909d22c"
ORG_ID="a9763151-ea95-4dbe-bc14-68d9c212ecec"

# Check for Organization API Key argument
if [ -z "$1" ]; then
    echo "Usage: ./configure-onesignal.sh <ORGANIZATION_API_KEY>"
    echo ""
    echo "To get your Organization API Key:"
    echo "1. Go to https://dashboard.onesignal.com"
    echo "2. Click Organizations (left sidebar)"
    echo "3. Select your organization"
    echo "4. Go to Keys & IDs"
    echo "5. Click 'Add Key' to create an Organization API Key"
    echo ""
    exit 1
fi

ORG_API_KEY="$1"

echo "Configuring OneSignal Web Push for Pulse WiFi..."
echo ""

# Update app with web push configuration
curl -X PUT "https://api.onesignal.com/apps/${APP_ID}" \
  -H "Authorization: Key ${ORG_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pulse WiFi",
    "organization_id": "'"${ORG_ID}"'",
    "chrome_web_origin": "https://app.pulsewifi.co.uk",
    "site_name": "Pulse WiFi",
    "safari_site_origin": "https://app.pulsewifi.co.uk",
    "chrome_web_default_notification_icon": "https://app.pulsewifi.co.uk/icons/icon-192x192.png"
  }' | python3 -m json.tool

echo ""
echo "Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Deploy your app to Vercel with: vercel --prod"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Test push notifications on your live site"
