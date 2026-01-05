/**
 * 入力バリデーションユーティリティ
 */

export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

/**
 * 文字列長のバリデーション
 */
export function validateStringLength(
  value: string,
  options: {
    min?: number;
    max?: number;
    fieldName?: string;
  }
): ValidationResult {
  const trimmed = value.trim();
  const { min = 0, max = Infinity, fieldName = "入力値" } = options;

  if (trimmed.length === 0 && min > 0) {
    return {
      isValid: false,
      error: `${fieldName}を入力してください。`,
    };
  }

  if (trimmed.length < min) {
    return {
      isValid: false,
      error: `${fieldName}は${min}文字以上で入力してください。`,
    };
  }

  if (trimmed.length > max) {
    return {
      isValid: false,
      error: `${fieldName}は${max}文字以内で入力してください。`,
    };
  }

  return { isValid: true };
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: "メールアドレスを入力してください。",
    };
  }

  // RFC 5322準拠の簡易版正規表現
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "有効なメールアドレスを入力してください。",
    };
  }

  if (trimmed.length > 254) {
    return {
      isValid: false,
      error: "メールアドレスは254文字以内で入力してください。",
    };
  }

  return { isValid: true };
}

/**
 * パスワードのバリデーション
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecialChar?: boolean;
  } = {}
): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecialChar = false,
  } = options;

  if (password.length === 0) {
    return {
      isValid: false,
      error: "パスワードを入力してください。",
    };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `パスワードは${minLength}文字以上で入力してください。`,
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "パスワードには大文字を含めてください。",
    };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "パスワードには小文字を含めてください。",
    };
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: "パスワードには数字を含めてください。",
    };
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      error: "パスワードには特殊文字を含めてください。",
    };
  }

  return { isValid: true };
}

/**
 * 数値範囲のバリデーション
 */
export function validateNumberRange(
  value: number,
  options: {
    min?: number;
    max?: number;
    fieldName?: string;
  }
): ValidationResult {
  const { min = -Infinity, max = Infinity, fieldName = "入力値" } = options;

  if (isNaN(value)) {
    return {
      isValid: false,
      error: `${fieldName}は数値で入力してください。`,
    };
  }

  if (value < min) {
    return {
      isValid: false,
      error: `${fieldName}は${min}以上で入力してください。`,
    };
  }

  if (value > max) {
    return {
      isValid: false,
      error: `${fieldName}は${max}以下で入力してください。`,
    };
  }

  return { isValid: true };
}

/**
 * 日付のバリデーション
 */
export function validateDate(
  dateString: string,
  options: {
    allowPast?: boolean;
    allowFuture?: boolean;
    minDate?: Date;
    maxDate?: Date;
    fieldName?: string;
  } = {}
): ValidationResult {
  const {
    allowPast = true,
    allowFuture = true,
    minDate,
    maxDate,
    fieldName = "日付",
  } = options;

  if (!dateString || dateString.trim().length === 0) {
    return { isValid: true }; // 空は許容（必須チェックは別で行う）
  }

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: `有効な${fieldName}を入力してください。`,
    };
  }

  if (!allowPast && date < today) {
    return {
      isValid: false,
      error: `${fieldName}は今日以降の日付を入力してください。`,
    };
  }

  if (!allowFuture && date > today) {
    return {
      isValid: false,
      error: `${fieldName}は今日以前の日付を入力してください。`,
    };
  }

  if (minDate && date < minDate) {
    return {
      isValid: false,
      error: `${fieldName}は${minDate.toLocaleDateString()}以降を入力してください。`,
    };
  }

  if (maxDate && date > maxDate) {
    return {
      isValid: false,
      error: `${fieldName}は${maxDate.toLocaleDateString()}以前を入力してください。`,
    };
  }

  return { isValid: true };
}

/**
 * タスクタイトルのバリデーション
 */
export function validateTaskTitle(title: string): ValidationResult {
  return validateStringLength(title, {
    min: 1,
    max: 200,
    fieldName: "タスク名",
  });
}

/**
 * 現場名のバリデーション
 */
export function validateSiteName(site: string): ValidationResult {
  if (!site || site.trim().length === 0) {
    return { isValid: true }; // 現場名は任意
  }

  return validateStringLength(site, {
    min: 1,
    max: 100,
    fieldName: "現場名",
  });
}

/**
 * 説明文のバリデーション
 */
export function validateDescription(description: string): ValidationResult {
  if (!description || description.trim().length === 0) {
    return { isValid: true }; // 説明は任意
  }

  return validateStringLength(description, {
    min: 0,
    max: 2000,
    fieldName: "説明",
  });
}

/**
 * 進捗率のバリデーション
 */
export function validateProgress(progress: number): ValidationResult {
  return validateNumberRange(progress, {
    min: 0,
    max: 100,
    fieldName: "進捗率",
  });
}

/**
 * 写真タイトルのバリデーション
 */
export function validatePhotoTitle(title: string): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { isValid: true }; // タイトルは任意
  }

  return validateStringLength(title, {
    min: 1,
    max: 100,
    fieldName: "写真タイトル",
  });
}

/**
 * 写真説明のバリデーション
 */
export function validatePhotoDescription(description: string): ValidationResult {
  if (!description || description.trim().length === 0) {
    return { isValid: true }; // 説明は任意
  }

  return validateStringLength(description, {
    min: 0,
    max: 500,
    fieldName: "写真説明",
  });
}

/**
 * ファイルサイズのバリデーション（バイト単位）
 */
export function validateFileSize(
  size: number,
  maxSizeMB: number
): ValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (size > maxSizeBytes) {
    return {
      isValid: false,
      error: `ファイルサイズは${maxSizeMB}MB以下にしてください。`,
    };
  }

  return { isValid: true };
}

/**
 * ファイルタイプのバリデーション
 */
export function validateFileType(
  type: string,
  allowedTypes: string[]
): ValidationResult {
  if (!allowedTypes.includes(type)) {
    const allowedExtensions = allowedTypes
      .map((t) => t.split("/")[1])
      .join(", ");
    return {
      isValid: false,
      error: `許可されているファイル形式: ${allowedExtensions}`,
    };
  }

  return { isValid: true };
}
