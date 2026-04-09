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

/**
 * JSON レスポンスを生成
 *
 * @param {Object} data - レスポンスデータ
 * @returns {ContentService} JSON レスポンス
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * リクエストボディの JSON を取得
 *
 * @param {Object} e - doPost のイベントオブジェクト
 * @returns {Object} パース済み JSON
 */
function getRequestJson(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('Invalid JSON request body');
  }
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
    // JSONP callback パラメータを最初にチェック（不要な処理を避けるため）
    // GitHub Pages + JSONP 経路の廃止により、callback パラメータは受け付けない
    if (e.parameter.callback) {
      return createJsonError('JSONP is not supported. Please use JSON API via Cloudflare Functions.');
    }
    
    var action = e.parameter.action;
    
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

      if (action === 'getActiveSurvey') {
        return handleGetActiveSurvey();
      }

      if (action === 'listSurveys') {
        return handleListSurveys();
      }

      if (action === 'getResponses') {
        return handleGetResponses(e);
      }

      if (action === 'getUser') {
        return handleGetUser(e);
      }

      if (action === 'listConfirmedEvents') {
        return handleListConfirmedEvents(e);
      }

      if (action === 'listUsers') {
        return handleListUsers(e);
      }

      return createJsonError('Unknown action');
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
    var requestBody = getRequestJson(e);
    
    logToSheet('INFO', 'doPost', 'POST リクエストを受信しました', {
      action: action
    });

    if (!validateApiKey(e)) {
      return createJsonError('Unauthorized');
    }
    
    // 簡易ルーティング（将来の拡張用）
    if (action === 'saveResponse') {
      return handleSaveResponse(requestBody);
    }

    if (action === 'registerUser') {
      return handleRegisterUser(requestBody);
    }

    if (action === 'switchActiveSurvey') {
      return handleSwitchActiveSurvey(requestBody);
    }

    if (action === 'registerConfirmedEvent') {
      return handleRegisterConfirmedEvent(requestBody);
    }

    if (action === 'addEventParticipants') {
      return handleAddEventParticipants(requestBody);
    }

    if (action === 'removeEventParticipant') {
      return handleRemoveEventParticipant(requestBody);
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

/**
 * 現在アクティブなアンケートを取得
 *
 * @returns {ContentService} JSON レスポンス
 */
function handleGetActiveSurvey() {
  var surveyBundle = getActiveSurveyBundle();

  return createJsonResponse({
    ok: true,
    survey: surveyBundle.survey,
    dates: surveyBundle.dates
  });
}

/**
 * ユーザー情報を取得
 *
 * @param {Object} e - doGet のイベントオブジェクト
 * @returns {ContentService} JSON レスポンス
 */
function handleGetUser(e) {
  var lineUserId = getRequiredString(e.parameter.lineUserId, 'lineUserId');
  var user = findUserByLineUserId(lineUserId);

  return createJsonResponse({
    ok: true,
    user: user
  });
}

/**
 * アンケート一覧を取得
 *
 * @returns {ContentService} JSON レスポンス
 */
function handleListSurveys() {
  var surveys = getSheetRecords('Surveys');
  var activeSurveyId = getConfigValue('activeSurveyId');
  var sanitized = [];
  var index;

  for (index = 0; index < surveys.length; index += 1) {
    sanitized.push(sanitizeSurveyRecord(surveys[index]));
  }

  return createJsonResponse({
    ok: true,
    surveys: sanitized,
    activeSurveyId: activeSurveyId
  });
}

/**
 * 回答一覧を取得（surveyId でフィルタ可能）
 *
 * @param {Object} e - doGet のイベントオブジェクト
 * @returns {ContentService} JSON レスポンス
 */
function handleGetResponses(e) {
  var surveyId = getOptionalString(e.parameter.surveyId);
  var responses = getSheetRecords('Responses');
  var filtered = [];
  var index;

  for (index = 0; index < responses.length; index += 1) {
    if (!surveyId || String(responses[index].surveyId) === surveyId) {
      filtered.push(sanitizeResponseRecord(responses[index]));
    }
  }

  return createJsonResponse({
    ok: true,
    responses: filtered
  });
}

/**
 * アクティブなアンケートを切り替え
 *
 * @param {Object} payload - { surveyId: string }
 * @returns {ContentService} JSON レスポンス
 */
function handleSwitchActiveSurvey(payload) {
  var surveyId = getRequiredString(payload.surveyId, 'surveyId');
  var surveys = getSheetRecords('Surveys');
  var survey = findRecordByField(surveys, 'surveyId', surveyId);

  if (!survey) {
    throw new Error('Survey not found: ' + surveyId);
  }

  if (String(survey.status || '') !== 'active') {
    throw new Error('Survey is not active: ' + surveyId + ' (status: ' + (survey.status || 'unknown') + ')');
  }

  setConfigValue('activeSurveyId', surveyId);

  logToSheet('INFO', 'handleSwitchActiveSurvey', 'アクティブなアンケートを切り替えました', {
    surveyId: surveyId,
    title: survey.title
  });

  return createJsonResponse({
    ok: true,
    activeSurveyId: surveyId
  });
}

/**
 * 確定日程の一覧を取得（fiscalYear でフィルタ可能）
 *
 * @param {Object} e - doGet のイベントオブジェクト
 * @returns {ContentService} JSON レスポンス
 */
function handleListConfirmedEvents(e) {
  var fiscalYear = getOptionalString(e.parameter.fiscalYear);
  var events = getSheetRecords('ConfirmedEvents');
  var participants = getSheetRecords('EventParticipants');
  var filtered = [];
  var index;

  for (index = 0; index < events.length; index += 1) {
    if (!fiscalYear || String(events[index].fiscalYear) === fiscalYear) {
      var evt = sanitizeConfirmedEventRecord(events[index]);
      evt.participants = getParticipantsForEvent(participants, evt.eventId);
      filtered.push(evt);
    }
  }

  filtered.sort(function(a, b) {
    return String(a.eventDate).localeCompare(String(b.eventDate));
  });

  return createJsonResponse({
    ok: true,
    events: filtered
  });
}

/**
 * ユーザー一覧を取得（fiscalYear でフィルタ可能）
 *
 * @param {Object} e - doGet のイベントオブジェクト
 * @returns {ContentService} JSON レスポンス
 */
function handleListUsers(e) {
  var fiscalYear = getOptionalString(e.parameter.fiscalYear);
  var users = getSheetRecords('Users');
  var filtered = [];
  var index;

  for (index = 0; index < users.length; index += 1) {
    if (!fiscalYear || String(users[index].fiscalYear) === fiscalYear) {
      filtered.push(sanitizeUserRecord(users[index]));
    }
  }

  return createJsonResponse({
    ok: true,
    users: filtered
  });
}

/**
 * 確定日程を登録
 *
 * @param {Object} payload - { fiscalYear, eventDate, targetGrade, className?, surveyId?, surveyDateId?, notes? }
 * @returns {ContentService} JSON レスポンス
 */
function handleRegisterConfirmedEvent(payload) {
  var fiscalYear = getRequiredString(payload.fiscalYear, 'fiscalYear');
  var eventDate = getRequiredString(payload.eventDate, 'eventDate');
  var targetGrade = getRequiredString(payload.targetGrade, 'targetGrade');

  validateAllowedValue(targetGrade, ['年少', '年中', '年長', '全学年'], 'targetGrade');

  var eventId = generateSequentialId('ConfirmedEvents', 'eventId', 'evt_');
  var now = new Date();
  var values = [
    eventId,
    getOptionalString(payload.surveyId),
    getOptionalString(payload.surveyDateId),
    fiscalYear,
    eventDate,
    targetGrade,
    getOptionalString(payload.className),
    now,
    getOptionalString(payload.notes)
  ];

  appendSheetRecord('ConfirmedEvents', values);

  logToSheet('INFO', 'handleRegisterConfirmedEvent', '確定日程を登録しました', {
    eventId: eventId,
    eventDate: eventDate,
    targetGrade: targetGrade
  });

  return createJsonResponse({
    ok: true,
    event: sanitizeConfirmedEventRecord({
      eventId: eventId,
      surveyId: getOptionalString(payload.surveyId),
      surveyDateId: getOptionalString(payload.surveyDateId),
      fiscalYear: fiscalYear,
      eventDate: eventDate,
      targetGrade: targetGrade,
      className: getOptionalString(payload.className),
      confirmedAt: now,
      notes: getOptionalString(payload.notes)
    })
  });
}

/**
 * 確定日程に参加者を追加（複数可）
 *
 * @param {Object} payload - { eventId, participants: [{ lineUserId, role?, notes? }] }
 * @returns {ContentService} JSON レスポンス
 */
function handleAddEventParticipants(payload) {
  var eventId = getRequiredString(payload.eventId, 'eventId');

  if (!payload.participants || !payload.participants.length) {
    throw new Error('participants is required and must be a non-empty array');
  }

  // eventId の存在確認
  var events = getSheetRecords('ConfirmedEvents');
  var event = findRecordByField(events, 'eventId', eventId);
  if (!event) {
    throw new Error('Event not found: ' + eventId);
  }

  var now = new Date();
  var added = [];
  var index;

  for (index = 0; index < payload.participants.length; index += 1) {
    var p = payload.participants[index];
    var lineUserId = getRequiredString(p.lineUserId, 'participants[' + index + '].lineUserId');
    var role = getOptionalString(p.role) || 'reader';
    var participantId = generateSequentialId('EventParticipants', 'participantId', 'par_');
    var values = [
      participantId,
      eventId,
      lineUserId,
      role,
      now,
      getOptionalString(p.notes)
    ];

    appendSheetRecord('EventParticipants', values);

    added.push(sanitizeEventParticipantRecord({
      participantId: participantId,
      eventId: eventId,
      lineUserId: lineUserId,
      role: role,
      confirmedAt: now,
      notes: getOptionalString(p.notes)
    }));
  }

  logToSheet('INFO', 'handleAddEventParticipants', '参加者を追加しました', {
    eventId: eventId,
    count: added.length
  });

  return createJsonResponse({
    ok: true,
    participants: added
  });
}

/**
 * 確定日程から参加者を削除
 *
 * @param {Object} payload - { participantId }
 * @returns {ContentService} JSON レスポンス
 */
function handleRemoveEventParticipant(payload) {
  var participantId = getRequiredString(payload.participantId, 'participantId');

  return withLock(function() {
    var sheet = getSheetOrThrow('EventParticipants');
    var records = getSheetRecords('EventParticipants');
    var target = findRecordByField(records, 'participantId', participantId);

    if (!target) {
      throw new Error('Participant not found: ' + participantId);
    }

    sheet.deleteRow(target._rowNumber);

    logToSheet('INFO', 'handleRemoveEventParticipant', '参加者を削除しました', {
      participantId: participantId,
      eventId: target.eventId
    });

    return createJsonResponse({
      ok: true,
      deleted: participantId
    });
  });
}

/**
 * ユーザーを登録または更新
 *
 * @param {Object} payload - 登録内容
 * @returns {ContentService} JSON レスポンス
 */
function handleRegisterUser(payload) {
  var userRecord = normalizeUserPayload(payload);
  var savedUser = upsertUserRecord(userRecord);

  logToSheet('INFO', 'handleRegisterUser', 'Users シートを更新しました', {
    fiscalYear: savedUser.fiscalYear,
    grade: savedUser.grade,
    className: savedUser.class
  });

  return createJsonResponse({
    ok: true,
    user: savedUser
  });
}

/**
 * 回答を保存または更新
 *
 * @param {Object} payload - 回答内容
 * @returns {ContentService} JSON レスポンス
 */
function handleSaveResponse(payload) {
  var responseRecord = normalizeResponsePayload(payload);
  var savedResponse = saveOrUpdateResponse(responseRecord);

  logToSheet('INFO', 'handleSaveResponse', 'Responses シートを更新しました', {
    surveyId: savedResponse.surveyId,
    surveyDateId: savedResponse.surveyDateId,
    answer: savedResponse.answer
  });

  return createJsonResponse({
    ok: true,
    response: savedResponse
  });
}

// ========================================
// Sheet Helpers
// ========================================

function getSheetOrThrow(sheetName) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }

  return sheet;
}

function getSheetRecords(sheetName) {
  var sheet = getSheetOrThrow(sheetName);
  var values = sheet.getDataRange().getValues();

  if (!values || values.length <= 1) {
    return [];
  }

  var headers = values[0];
  var records = [];
  var rowIndex;
  var columnIndex;
  var row;
  var record;

  for (rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    row = values[rowIndex];
    record = {
      _rowNumber: rowIndex + 1
    };

    for (columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      record[String(headers[columnIndex])] = row[columnIndex];
    }

    if (sheetName === 'Surveys') {
      record = normalizeSurveySheetRecord(record);
    }

    records.push(record);
  }

  return records;
}

function normalizeSurveySheetRecord(record) {
  var normalized = record;
  var extraUpdatedAt = getOptionalString(record['']);
  var descriptionPrefix;

  if (isKnownSurveyStatus(getOptionalString(record.status))) {
    return normalized;
  }

  if (!isKnownSurveyStatus(getOptionalString(record.createdAt))) {
    return normalized;
  }

  descriptionPrefix = getOptionalString(record.description);
  normalized.description = [descriptionPrefix, getOptionalString(record.status)].filter(function(value) {
    return value;
  }).join(' ');
  normalized.status = getOptionalString(record.createdAt);
  normalized.createdAt = record.updatedAt;
  normalized.updatedAt = extraUpdatedAt || record.updatedAt;

  return normalized;
}

function isKnownSurveyStatus(value) {
  return value === 'draft' || value === 'active' || value === 'closed';
}

function findRecordByField(records, fieldName, expectedValue) {
  var index;

  for (index = 0; index < records.length; index += 1) {
    if (String(records[index][fieldName]) === String(expectedValue)) {
      return records[index];
    }
  }

  return null;
}

function appendSheetRecord(sheetName, values) {
  return withLock(function() {
    var sheet = getSheetOrThrow(sheetName);
    sheet.appendRow(values);
  });
}

function updateSheetRow(sheetName, rowNumber, values) {
  return withLock(function() {
    var sheet = getSheetOrThrow(sheetName);
    sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
  });
}

function getConfigValue(key) {
  var configRecords = getSheetRecords('Config');
  var configRecord = findRecordByField(configRecords, 'key', key);

  if (!configRecord) {
    return '';
  }

  return String(configRecord.value || '');
}

function setConfigValue(key, value) {
  return withLock(function() {
    var sheet = getSheetOrThrow('Config');
    var records = getSheetRecords('Config');
    var existing = findRecordByField(records, 'key', key);

    if (existing) {
      sheet.getRange(existing._rowNumber, 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
    }
  });
}

function getActiveSurveyBundle() {
  var activeSurveyId = getConfigValue('activeSurveyId');
  var surveys;
  var survey;
  var surveyDates;

  if (!activeSurveyId) {
    throw new Error('Config.activeSurveyId is not set');
  }

  surveys = getSheetRecords('Surveys');
  survey = findRecordByField(surveys, 'surveyId', activeSurveyId);

  if (!survey) {
    throw new Error('Active survey not found: ' + activeSurveyId);
  }

  if (String(survey.status || '') !== 'active') {
    throw new Error('Active survey is not published');
  }

  surveyDates = getSurveyDatesBySurveyId(activeSurveyId);

  return {
    survey: sanitizeSurveyRecord(survey),
    dates: surveyDates
  };
}

function getSurveyDatesBySurveyId(surveyId) {
  var records = getSheetRecords('SurveyDates');
  var filtered = [];
  var index;

  for (index = 0; index < records.length; index += 1) {
    if (String(records[index].surveyId) === String(surveyId)) {
      filtered.push(sanitizeSurveyDateRecord(records[index]));
    }
  }

  filtered.sort(function(a, b) {
    var sortA = parseInt(a.sortOrder || '999999', 10);
    var sortB = parseInt(b.sortOrder || '999999', 10);

    if (sortA !== sortB) {
      return sortA - sortB;
    }

    return String(a.dateTime).localeCompare(String(b.dateTime));
  });

  return filtered;
}

function findUserByLineUserId(lineUserId) {
  return findUserByLineUserIdAndFiscalYear(lineUserId, '');
}

function findUserByLineUserIdAndFiscalYear(lineUserId, fiscalYear) {
  var users = getSheetRecords('Users');
  var latestMatch = null;
  var index;

  for (index = 0; index < users.length; index += 1) {
    if (String(users[index].lineUserId) === String(lineUserId) && (!fiscalYear || String(users[index].fiscalYear) === String(fiscalYear))) {
      latestMatch = users[index];
    }
  }

  return latestMatch ? sanitizeUserRecord(latestMatch) : null;
}

function upsertUserRecord(userRecord) {
  return withLock(function() {
    var sheet = getSheetOrThrow('Users');
    var users = getSheetRecords('Users');
    var existing = null;
    var index;
    var now = new Date();
    var createdAt;
    var values;

    for (index = 0; index < users.length; index += 1) {
      if (String(users[index].lineUserId) === String(userRecord.lineUserId) && String(users[index].fiscalYear) === String(userRecord.fiscalYear)) {
        existing = users[index];
      }
    }

    createdAt = existing ? existing.createdAt || now : now;
    values = [
      userRecord.lineUserId,
      userRecord.displayName,
      userRecord.childName,
      userRecord.grade,
      userRecord.class,
      userRecord.fiscalYear,
      createdAt,
      now
    ];

    if (existing) {
      sheet.getRange(existing._rowNumber, 1, 1, values.length).setValues([values]);
    } else {
      sheet.appendRow(values);
    }

    return sanitizeUserRecord({
      lineUserId: userRecord.lineUserId,
      displayName: userRecord.displayName,
      childName: userRecord.childName,
      grade: userRecord.grade,
      class: userRecord.class,
      fiscalYear: userRecord.fiscalYear,
      createdAt: createdAt,
      updatedAt: now
    });
  });
}

function saveOrUpdateResponse(responseRecord) {
  return withLock(function() {
    var activeSurveyBundle = getActiveSurveyBundle();
    var responses = getSheetRecords('Responses');
    var matchingDate = null;
    var existing = null;
    var index;
    var now = new Date();
    var values;
    var responseId;
    var sheet = getSheetOrThrow('Responses');

    if (String(activeSurveyBundle.survey.surveyId) !== String(responseRecord.surveyId)) {
      throw new Error('surveyId does not match Config.activeSurveyId');
    }

    for (index = 0; index < activeSurveyBundle.dates.length; index += 1) {
      if (String(activeSurveyBundle.dates[index].surveyDateId) === String(responseRecord.surveyDateId)) {
        matchingDate = activeSurveyBundle.dates[index];
        break;
      }
    }

    if (!matchingDate) {
      throw new Error('surveyDateId does not belong to the active survey');
    }

    for (index = 0; index < responses.length; index += 1) {
      if (String(responses[index].lineUserId) === String(responseRecord.lineUserId) && String(responses[index].surveyDateId) === String(responseRecord.surveyDateId)) {
        existing = responses[index];
      }
    }

    if (existing) {
      responseId = existing.responseId;
    } else {
      responseId = generateSequentialId('Responses', 'responseId', 'res_');
    }

    values = [
      responseId,
      responseRecord.surveyId,
      responseRecord.surveyDateId,
      responseRecord.lineUserId,
      responseRecord.answer,
      now,
      responseRecord.notes
    ];

    if (existing) {
      sheet.getRange(existing._rowNumber, 1, 1, values.length).setValues([values]);
    } else {
      sheet.appendRow(values);
    }

    return sanitizeResponseRecord({
      responseId: responseId,
      surveyId: responseRecord.surveyId,
      surveyDateId: responseRecord.surveyDateId,
      lineUserId: responseRecord.lineUserId,
      answer: responseRecord.answer,
      submittedAt: now,
      notes: responseRecord.notes
    });
  });
}

function generateSequentialId(sheetName, fieldName, prefix) {
  var records = getSheetRecords(sheetName);
  var lastNumber = 0;
  var index;
  var recordValue;
  var match;

  for (index = 0; index < records.length; index += 1) {
    recordValue = String(records[index][fieldName] || '');
    match = recordValue.match(new RegExp('^' + prefix.replace('_', '\\_') + '(\\d+)$'));

    if (match) {
      lastNumber = Math.max(lastNumber, parseInt(match[1], 10));
    }
  }

  return prefix + String(lastNumber + 1).padStart(3, '0');
}

// ========================================
// Normalizers and Validators
// ========================================

function normalizeUserPayload(payload) {
  var currentFiscalYear = getFiscalYearFromSurvey() || String(new Date().getFullYear());
  var grade = getRequiredString(payload.grade, 'grade');
  var className = getRequiredString(payload.class, 'class');

  validateAllowedValue(grade, ['年少', '年中', '年長'], 'grade');

  return {
    lineUserId: getRequiredString(payload.lineUserId, 'lineUserId'),
    displayName: getOptionalString(payload.displayName),
    childName: getRequiredString(payload.childName, 'childName'),
    grade: grade,
    class: className,
    fiscalYear: getOptionalString(payload.fiscalYear) || currentFiscalYear
  };
}

function normalizeResponsePayload(payload) {
  var answer = getRequiredString(payload.answer, 'answer');
  var lineUserId = getRequiredString(payload.lineUserId, 'lineUserId');
  var fiscalYear = getFiscalYearFromSurvey();

  validateAllowedValue(answer, ['可', '不可', '未定'], 'answer');

  if (!findUserByLineUserIdAndFiscalYear(lineUserId, fiscalYear)) {
    throw new Error('User is not registered');
  }

  return {
    surveyId: getRequiredString(payload.surveyId, 'surveyId'),
    surveyDateId: getRequiredString(payload.surveyDateId, 'surveyDateId'),
    lineUserId: lineUserId,
    answer: answer,
    notes: getOptionalString(payload.notes)
  };
}

function getRequiredString(value, fieldName) {
  var normalized = getOptionalString(value);

  if (!normalized) {
    throw new Error(fieldName + ' is required');
  }

  return normalized;
}

function getOptionalString(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/^\s+|\s+$/g, '');
}

function validateAllowedValue(value, allowedValues, fieldName) {
  var index;

  for (index = 0; index < allowedValues.length; index += 1) {
    if (value === allowedValues[index]) {
      return;
    }
  }

  throw new Error(fieldName + ' is invalid');
}

function getFiscalYearFromSurvey() {
  var activeSurveyId = getConfigValue('activeSurveyId');
  var surveys;
  var survey;

  if (!activeSurveyId) {
    return '';
  }

  surveys = getSheetRecords('Surveys');
  survey = findRecordByField(surveys, 'surveyId', activeSurveyId);

  return survey ? String(survey.fiscalYear || '') : '';
}

// ========================================
// Sanitizers
// ========================================

function sanitizeSurveyRecord(record) {
  return {
    surveyId: String(record.surveyId || ''),
    fiscalYear: String(record.fiscalYear || ''),
    title: String(record.title || ''),
    description: String(record.description || ''),
    status: String(record.status || ''),
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt)
  };
}

function sanitizeSurveyDateRecord(record) {
  return {
    surveyDateId: String(record.surveyDateId || ''),
    surveyId: String(record.surveyId || ''),
    dateTime: toIsoString(record.dateTime),
    targetGrade: String(record.targetGrade || ''),
    label: String(record.label || ''),
    sortOrder: String(record.sortOrder || ''),
    notes: String(record.notes || '')
  };
}

function sanitizeUserRecord(record) {
  return {
    lineUserId: String(record.lineUserId || ''),
    displayName: String(record.displayName || ''),
    childName: String(record.childName || ''),
    grade: String(record.grade || ''),
    class: String(record.class || ''),
    fiscalYear: String(record.fiscalYear || ''),
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt)
  };
}

function sanitizeResponseRecord(record) {
  return {
    responseId: String(record.responseId || ''),
    surveyId: String(record.surveyId || ''),
    surveyDateId: String(record.surveyDateId || ''),
    lineUserId: String(record.lineUserId || ''),
    answer: String(record.answer || ''),
    submittedAt: toIsoString(record.submittedAt),
    notes: String(record.notes || '')
  };
}

function sanitizeConfirmedEventRecord(record) {
  return {
    eventId: String(record.eventId || ''),
    surveyId: String(record.surveyId || ''),
    surveyDateId: String(record.surveyDateId || ''),
    fiscalYear: String(record.fiscalYear || ''),
    eventDate: toIsoString(record.eventDate),
    targetGrade: String(record.targetGrade || ''),
    className: String(record.className || ''),
    confirmedAt: toIsoString(record.confirmedAt),
    notes: String(record.notes || '')
  };
}

function sanitizeEventParticipantRecord(record) {
  return {
    participantId: String(record.participantId || ''),
    eventId: String(record.eventId || ''),
    lineUserId: String(record.lineUserId || ''),
    role: String(record.role || ''),
    confirmedAt: toIsoString(record.confirmedAt),
    notes: String(record.notes || '')
  };
}

function getParticipantsForEvent(allParticipants, eventId) {
  var result = [];
  var index;

  for (index = 0; index < allParticipants.length; index += 1) {
    if (String(allParticipants[index].eventId) === String(eventId)) {
      result.push(sanitizeEventParticipantRecord(allParticipants[index]));
    }
  }

  return result;
}

function toIsoString(value) {
  if (!value) {
    return '';
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  return String(value);
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
