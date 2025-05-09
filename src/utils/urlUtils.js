/**
 * 从URL中提取ID参数
 * @returns {string|null} 提取的ID或null
 */
export const extractIdFromUrl = () => {
    // 1. 先尝试从URL hash部分获取
    const hashPart = window.location.hash;
    if (hashPart && hashPart.includes('id=')) {
        const queryString = hashPart.split('?')[1] || '';
        const urlParams = new URLSearchParams(queryString);
        const id = urlParams.get('id');
        if (id) return id;
    }

    // 2. 尝试从查询参数获取
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) return id;

    // 3. 从 sessionStorage 中获取（如果之前保存过）
    const storedId = sessionStorage.getItem('scan_id');
    if (storedId) {
        // 使用后清除，避免后续影响
        sessionStorage.removeItem('scan_id');
        return storedId;
    }

    return null;
};

/**
 * 保存ID参数到会话存储
 * @param {string} id - 要保存的ID
 */
export const saveIdToSession = (id) => {
    if (id) {
        sessionStorage.setItem('scan_id', id);
    }
};

/**
 * 构建正确的路径URL
 * @param {string} path - 目标路径
 * @param {Object} params - URL参数
 * @returns {string} 完整URL
 */
export const buildPathWithSubdir = (path, params = {}) => {
    // 确保路径以/开头且不以/结尾
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // 构建查询字符串
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            queryParams.append(key, value);
        }
    });

    const queryString = queryParams.toString();
    const query = queryString ? `?${queryString}` : '';

    // 返回完整路径
    return `/book_h5${normalizedPath}${query}`;
};
