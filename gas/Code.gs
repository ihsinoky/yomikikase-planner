/**
 * yomikikase-planner Google Apps Script Web App
 * 
 * LIFF 画面を配信し、Spreadsheet への読み書きを行う GAS Web App の骨格実装
 */

// ========================================
// Configuration
// ========================================

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
    
    // 簡易ルーティング
    if (action === 'health') {
      return handleHealthCheck();
    }
    
    // デフォルト: LIFF HTML を返す
    return handleServeHtml();
    
  } catch (error) {
    logToSheet('ERROR', 'doGet', 'リクエスト処理中にエラーが発生しました', {
      error: error.toString(),
      stack: error.stack
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: 'Internal server error'
      }))
      .setMimeType(ContentService.MimeType.JSON);
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
      return ContentService
        .createTextOutput(JSON.stringify({
          ok: false,
          error: 'Not implemented yet'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: 'Unknown action'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    logToSheet('ERROR', 'doPost', 'リクエスト処理中にエラーが発生しました', {
      error: error.toString(),
      stack: error.stack
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: 'Internal server error'
      }))
      .setMimeType(ContentService.MimeType.JSON);
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
  var lastNum = parseInt(lastId.replace('log_', '')) || 0;
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
