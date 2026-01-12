/**
 * yomikikase-planner Google Apps Script Web App
 * 
 * LIFF 画面を配信し、Spreadsheet への読み書きを行う GAS Web App の骨格実装
 */

// ========================================
// Configuration
// ========================================

/**
 * API キーを取得（スクリプトプロパティから）
 * 
 * スクリプトプロパティに "API_KEY" を設定してください
 */
function getApiKey() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('API_KEY');
}

/**
 * クエリパラメータから API キーを検証
 * 
 * @param {Object} e - doGet/doPost のイベントオブジェクト
 * @returns {boolean} API キーが有効な場合 true
 */
function validateApiKey(e) {
  var apiKey = getApiKey();
  
  // API キーが未設定の場合は拒否（セキュリティ強化：API_KEY 必須化 - 直接アクセス防止とJSONP廃止のため）
  if (!apiKey) {
    Logger.log('ERROR: API_KEY is not configured in Script Properties');
    return false;
  }
  
  // クエリパラメータから apiKey を取得
  var requestApiKey = e.parameter.apiKey;
  
  // API キーがない場合は拒否
  if (!requestApiKey) {
    return false;
  }
  
  // タイミング攻撃を軽減するため、長さを先にチェック
  if (requestApiKey.length !== apiKey.length) {
    return false;
  }
  
  // API キーを比較（GAS では組み込みの定数時間比較がないため、単純比較を使用）
  // 注意: GAS の制約上、完全なタイミング攻撃対策は困難
  return requestApiKey === apiKey;
}

/**
 * アクティブなスプレッドシートを取得
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * ログシートを取得（存在しない場合は作成）
 */
function getLogsSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Logs');
  
  if (!sheet) {
    sheet = ss.insertSheet('Logs');
    // ヘッダー行を追加
    sheet.appendRow(['logId', 'timestamp', 'level', 'source', 'message', 'details']);
  }
  
  return sheet;
}

// ========================================
// HTTP Response Helpers
// ========================================

/**
 * JSON エラーレスポンスを生成
 * 
 * @param {string} errorMessage - エラーメッセージ
 * @returns {ContentService} JSON エラーレスポンス
 */
function createJsonError(errorMessage) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      error: errorMessage
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// HTTP Handlers
// ========================================

/**
 * doGet - HTTP GET リクエストのハンドラ
 * 
 * @param {Object} e - イベントオブジェクト
 * @returns {HtmlOutput|ContentService} HTML または JSON レスポンス
 */
function doGet(e) {
  try {
    var action = e.parameter.action;
    
    // JSONP callback パラメータを検出して拒否
    // GitHub Pages + JSONP 経路の廃止により、callback パラメータは受け付けない
    if (e.parameter.callback) {
      return createJsonError('JSONP is not supported. Please use JSON API via Cloudflare Functions.');
    }
    
    // 簡易ルーティング
    if (action === 'health') {
      // API キーの検証
      if (!validateApiKey(e)) {
        // GAS では HTTPステータスコードを設定できないため、エラーメッセージで対応
        return createJsonError('Unauthorized');
      }
      return handleHealthCheck();
    }
    
    // 将来の API エンドポイント用の認証（health は既に処理済み）
    // セキュアデフォルト：HTML 配信（action なし）は認証不要だが、
    // 新しい action が追加される場合は自動的に認証必須とする
    // これにより、新エンドポイント追加時に認証を忘れるリスクを防ぐ
    // 例: action=getSurveys, action=saveResponse などの将来実装
    if (action && action !== 'health') {
      if (!validateApiKey(e)) {
        return createJsonError('Unauthorized');
      }
    }
    
    // デフォルト: LIFF HTML を返す（認証不要）
    return handleServeHtml();
    
  } catch (error) {
    logToSheet('ERROR', 'doGet', 'リクエスト処理中にエラーが発生しました', {
      error: error.toString(),
      stack: error.stack
    });
    
    return createJsonError('Internal server error');
  }
}

/**
 * doPost - HTTP POST リクエストのハンドラ
 * 
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService} JSON レスポンス
 */
function doPost(e) {
  try {
    var action = e.parameter.action;
    
    logToSheet('INFO', 'doPost', 'POST リクエストを受信しました', {
      action: action
    });
    
    // 簡易ルーティング（将来の拡張用）
    if (action === 'saveResponse') {
      // Sprint 2 以降で実装予定
      return createJsonError('Not implemented yet');
    }
    
    return createJsonError('Unknown action');
      
  } catch (error) {
    logToSheet('ERROR', 'doPost', 'リクエスト処理中にエラーが発生しました', {
      error: error.toString(),
      stack: error.stack
    });
    
    return createJsonError('Internal server error');
  }
}

// ========================================
// Route Handlers
// ========================================

/**
 * ヘルスチェック API
 * 
 * @returns {ContentService} JSON レスポンス
 */
function handleHealthCheck() {
  try {
    logToSheet('INFO', 'handleHealthCheck', 'ヘルスチェックが実行されました');
  } catch (logError) {
    // ログ記録失敗は無視して処理を継続
    Logger.log('Warning: Failed to log health check: ' + logError.toString());
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      timestamp: new Date().toISOString(),
      message: 'yomikikase-planner GAS Web App is running'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * LIFF HTML を配信
 * 
 * @returns {HtmlOutput} HTML レスポンス
 */
function handleServeHtml() {
  try {
    logToSheet('INFO', 'handleServeHtml', 'LIFF HTML を配信しました');
  } catch (logError) {
    // ログ記録失敗は無視して処理を継続
    Logger.log('Warning: Failed to log HTML serving: ' + logError.toString());
  }
  
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('読み聞かせプランナー')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ========================================
// Logging
// ========================================

/**
 * Logs シートにログを記録
 * 
 * @param {string} level - ログレベル ('INFO', 'WARN', 'ERROR')
 * @param {string} source - ログ発生元（関数名など）
 * @param {string} message - ログメッセージ
 * @param {Object} details - 詳細情報（オプション）
 * @returns {boolean} ログ記録が成功した場合 true、失敗した場合 false
 */
function logToSheet(level, source, message, details) {
  try {
    return withLock(function() {
      var sheet = getLogsSheet();
      var timestamp = new Date();
      var logId = generateLogId();
      var detailsJson = details ? JSON.stringify(details) : '';
      
      sheet.appendRow([
        logId,
        timestamp,
        level,
        source,
        message,
        detailsJson
      ]);
      
      Logger.log('[' + level + '] ' + source + ': ' + message);
      return true;
    });
  } catch (error) {
    // ログ記録自体に失敗した場合は、詳細情報をコンソールに出力
    var errorMessage = 'Failed to log to sheet: ' + error.toString();
    if (error && error.stack) {
      errorMessage += '\nStack trace:\n' + error.stack;
    }
    Logger.log(errorMessage);
    return false;
  }
}

/**
 * ログIDを生成
 * 
 * @returns {string} ログID（例: log_001）
 */
function generateLogId() {
  var sheet = getLogsSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    // ヘッダーのみの場合
    return 'log_001';
  }
  
  var lastId = sheet.getRange(lastRow, 1).getValue();
  
  // ID フォーマットの検証（log_XXX 形式であることを確認）
  if (typeof lastId !== 'string' || !lastId.match(/^log_\d+$/)) {
    Logger.log('Warning: Invalid log ID format in last row: ' + lastId + '. Generating from row count.');
    // 不正な形式の場合は、行数から生成
    var nextNum = lastRow; // ヘッダーを除いた行数
    return 'log_' + String(nextNum).padStart(3, '0');
  }
  
  var lastNum = parseInt(lastId.replace('log_', ''), 10);
  var nextNum = lastNum + 1;
  
  return 'log_' + String(nextNum).padStart(3, '0');
}

// ========================================
// Lock Service Wrapper
// ========================================

/**
 * LockService を使って関数を排他実行する
 * 
 * @param {Function} fn - 実行する関数
 * @param {number} timeout - タイムアウト時間（ミリ秒）デフォルト: 30000
 * @returns {*} 関数の戻り値
 */
function withLock(fn, timeout) {
  var lock = LockService.getScriptLock();
  var timeoutMs = timeout || 30000; // デフォルト30秒
  
  try {
    // ロックを取得（タイムアウト付き）
    lock.waitLock(timeoutMs);
    
    try {
      // 関数を実行
      return fn();
    } finally {
      // 必ずロックを解放
      lock.releaseLock();
    }
  } catch (error) {
    // ロック取得に失敗した場合
    var message = (error && error.message) ? String(error.message) : String(error);
    var lowerMessage = message.toLowerCase();
    
    // タイムアウトによる失敗かどうかを判定
    if (lowerMessage.indexOf('timeout') !== -1 || lowerMessage.indexOf('time out') !== -1) {
      var timeoutError = new Error('Failed to acquire lock within ' + timeoutMs + ' ms: ' + message);
      timeoutError.name = 'LockTimeoutError';
      throw timeoutError;
    }
    
    // それ以外の予期しないエラー
    var lockError = new Error('Failed to acquire lock due to unexpected error: ' + message);
    lockError.name = 'LockAcquisitionError';
    throw lockError;
  }
}

// ========================================
// Utility Functions (for testing)
// ========================================

/**
 * テスト用: Logs シートをクリア
 * 
 * スクリプトエディタから手動実行する用
 */
function clearLogsSheet() {
  var sheet = getLogsSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  Logger.log('Logs sheet cleared');
}

/**
 * テスト用: ヘルスチェックを手動実行
 * 
 * スクリプトエディタから手動実行する用
 */
function testHealthCheck() {
  var result = handleHealthCheck();
  Logger.log(result.getContent());
}
