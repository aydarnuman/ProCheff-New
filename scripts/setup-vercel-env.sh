#!/bin/bash

echo "🚀 ProCheff Vercel Environment Variables Setup"
echo "=============================================="

# Environment variables to set in Vercel
declare -A ENV_VARS
ENV_VARS[NEXTAUTH_SECRET]="I9JU23NF394R6HH58KDMN239F4R6HH32"
ENV_VARS[NODE_ENV]="production"
ENV_VARS[ANTHROPIC_API_KEY]="sk-ant-your-api-key-here"
ENV_VARS[OPENAI_API_KEY]="sk-your-openai-key-here"
ENV_VARS[DATABASE_URL]=""

echo "📋 Required Environment Variables:"
echo "================================="

# Display environment variables
for key in "${!ENV_VARS[@]}"; do
    value="${ENV_VARS[$key]}"
    if [[ -z "$value" ]]; then
        echo "  $key: (empty - optional)"
    elif [[ "$key" == *"API_KEY"* ]]; then
        echo "  $key: ${value:0:10}... (truncated for security)"
    else
        echo "  $key: $value"
    fi
done

echo ""
echo "🌐 Vercel Setup Instructions:"
echo "============================="
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your ProCheff-New project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add each variable from the list above"
echo "5. Set Environment: Production (and Preview if needed)"
echo ""

# Check if Vercel CLI is available
if command -v vercel &> /dev/null; then
    echo "🔧 Vercel CLI detected!"
    echo "You can also run: vercel env add [KEY] production"
    echo ""
    
    # Auto-configure if user agrees
    read -p "🤖 Do you want to auto-configure with Vercel CLI? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Starting auto-configuration..."
        
        for key in "${!ENV_VARS[@]}"; do
            value="${ENV_VARS[$key]}"
            if [[ -n "$value" && "$key" != *"API_KEY"* ]]; then
                echo "Setting $key..."
                echo "$value" | vercel env add "$key" production
            elif [[ "$key" == *"API_KEY"* ]]; then
                echo "⚠️  Please manually set $key with your actual API key"
            fi
        done
        
        echo "✅ Basic environment variables configured!"
        echo "🔑 Don't forget to manually set your API keys!"
    fi
else
    echo "📦 Install Vercel CLI: npm i -g vercel"
    echo "🔐 Login: vercel login"
    echo "🔗 Link project: vercel link"
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Set your actual API keys in Vercel dashboard"
echo "2. Deploy: git push origin main"
echo "3. Test: https://procheff-new.vercel.app/api/health"
echo ""
echo "✨ Your Vercel environment is ready to configure!"