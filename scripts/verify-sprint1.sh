#!/bin/bash
# Sprint 1 完了確認スクリプト
# このスクリプトは、Sprint 1の全成果物が正しく配置されているかを確認します

echo "==================================="
echo "Sprint 1 完了確認"
echo "==================================="
echo ""

# カウンター
TOTAL=0
PASS=0
FAIL=0

# チェック関数
check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo "✅ $1"
        PASS=$((PASS + 1))
    else
        echo "❌ $1 が見つかりません"
        FAIL=$((FAIL + 1))
    fi
}

check_dir() {
    TOTAL=$((TOTAL + 1))
    if [ -d "$1" ]; then
        echo "✅ $1/"
        PASS=$((PASS + 1))
    else
        echo "❌ $1/ が見つかりません"
        FAIL=$((FAIL + 1))
    fi
}

echo "📁 ディレクトリ構造チェック"
echo "-----------------------------------"
check_dir "gas"
check_dir "sheet-template"
check_dir "docs"
echo ""

echo "💾 GAS実装ファイル"
echo "-----------------------------------"
check_file "gas/Code.gs"
check_file "gas/index.html"
echo ""

echo "📊 Spreadsheet テンプレート"
echo "-----------------------------------"
check_file "sheet-template/Config.csv"
check_file "sheet-template/Surveys.csv"
check_file "sheet-template/SurveyDates.csv"
check_file "sheet-template/Users.csv"
check_file "sheet-template/Responses.csv"
check_file "sheet-template/Logs.csv"
check_file "sheet-template/README.md"
echo ""

echo "📖 ドキュメント（gas/）"
echo "-----------------------------------"
check_file "gas/README.md"
check_file "gas/VERIFICATION.md"
check_file "gas/SPRINT1.md"
check_file "gas/SUMMARY.md"
echo ""

echo "📖 ドキュメント（docs/）"
echo "-----------------------------------"
check_file "docs/setup.md"
check_file "docs/sheets-schema.md"
check_file "docs/pivot-plan.md"
check_file "docs/sprint1-completion-report.md"
echo ""

echo "🔍 コンテンツ検証"
echo "-----------------------------------"

# Code.gs の主要関数チェック
TOTAL=$((TOTAL + 1))
if grep -q "function doGet" gas/Code.gs && \
   grep -q "function doPost" gas/Code.gs && \
   grep -q "function handleHealthCheck" gas/Code.gs && \
   grep -q "function logToSheet" gas/Code.gs && \
   grep -q "function withLock" gas/Code.gs; then
    echo "✅ Code.gs に全主要関数が存在"
    PASS=$((PASS + 1))
else
    echo "❌ Code.gs に必要な関数が不足"
    FAIL=$((FAIL + 1))
fi

# index.html の LIFF SDK チェック
TOTAL=$((TOTAL + 1))
if grep -q "liff/2.23.1/sdk.js" gas/index.html && \
   grep -q "liff.init" gas/index.html && \
   grep -q "liff.getProfile" gas/index.html && \
   grep -q "checkHealth" gas/index.html; then
    echo "✅ index.html に LIFF 実装が存在"
    PASS=$((PASS + 1))
else
    echo "❌ index.html に LIFF 実装が不足"
    FAIL=$((FAIL + 1))
fi

# CSV テンプレートのヘッダーチェック
TOTAL=$((TOTAL + 1))
if grep -q "key,value,description,updatedAt" sheet-template/Config.csv && \
   grep -q "surveyId,fiscalYear,title" sheet-template/Surveys.csv && \
   grep -q "surveyDateId,surveyId,dateTime" sheet-template/SurveyDates.csv && \
   grep -q "lineUserId,displayName,childName" sheet-template/Users.csv && \
   grep -q "responseId,surveyId,surveyDateId" sheet-template/Responses.csv && \
   grep -q "logId,timestamp,level" sheet-template/Logs.csv; then
    echo "✅ 全CSVテンプレートに正しいヘッダーが存在"
    PASS=$((PASS + 1))
else
    echo "❌ CSVテンプレートのヘッダーに問題"
    FAIL=$((FAIL + 1))
fi

# setup.md の主要セクションチェック
TOTAL=$((TOTAL + 1))
if grep -q "Google Spreadsheet の作成" docs/setup.md && \
   grep -q "Google Apps Script の作成" docs/setup.md && \
   grep -q "LINE Developers での LIFF 作成" docs/setup.md && \
   grep -q "動作確認" docs/setup.md && \
   grep -q "トラブルシューティング" docs/setup.md; then
    echo "✅ setup.md に全必要セクションが存在"
    PASS=$((PASS + 1))
else
    echo "❌ setup.md に必要なセクションが不足"
    FAIL=$((FAIL + 1))
fi

# sheets-schema.md のタブ定義チェック
TOTAL=$((TOTAL + 1))
if grep -q "Config タブ" docs/sheets-schema.md && \
   grep -q "Surveys タブ" docs/sheets-schema.md && \
   grep -q "SurveyDates タブ" docs/sheets-schema.md && \
   grep -q "Users タブ" docs/sheets-schema.md && \
   grep -q "Responses タブ" docs/sheets-schema.md && \
   grep -q "Logs タブ" docs/sheets-schema.md; then
    echo "✅ sheets-schema.md に全タブ定義が存在"
    PASS=$((PASS + 1))
else
    echo "❌ sheets-schema.md にタブ定義が不足"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "==================================="
echo "検証結果"
echo "==================================="
echo "総チェック項目: $TOTAL"
echo "成功: $PASS ✅"
echo "失敗: $FAIL ❌"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 Sprint 1 の全成果物が正しく配置されています！"
    echo ""
    echo "次のステップ:"
    echo "1. docs/setup.md に従って Google Apps Script をデプロイ"
    echo "2. LINE Developers で LIFF を設定"
    echo "3. gas/VERIFICATION.md に従って動作確認"
    echo ""
    exit 0
else
    echo "⚠️  一部のファイルまたは内容に問題があります。"
    echo "上記の ❌ 項目を確認してください。"
    echo ""
    exit 1
fi
