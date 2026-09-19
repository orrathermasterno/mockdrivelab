const url = import.meta.env.VITE_SERVER_URL;

export const fetchFiles = async (token) => {
    const res = await fetch(`${url}/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
        throw new Error("Session expired");
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch files');
    }

    return data.files || [];
};

export const deleteFile = async (id, token) => {
    const res = await fetch(`${url}/files/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const contentType = res.headers.get("content-type");
    let data = {};
    if (contentType && contentType.includes("application/json")) {
        data = await res.json();
    }

    if (!res.ok) {
        throw new Error(data.message || 'Failed to delete file');
    }

    return;
}

export const uploadFile = async (method, body, token) => {
    const res = await fetch(`${url}/files`, {
        method: method, 
        headers: { 'Authorization': `Bearer ${token}` },
        body: body
    });

    const contentType = res.headers.get("content-type");
    let data = {};
    if (contentType && contentType.includes("application/json")) {
        data = await res.json();
    }

    if (!res.ok) {
        throw new Error(data.message || 'Failed to upload file');
    }

    return;
}

export const downloadFile = async (id, token) => {
    const res = await fetch(`${url}/files/${id}?action=download`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            throw new Error(data.message || 'Failed to download file');
        }
        throw new Error('Failed to download file');
    }

    return await res.blob();
};

export const previewFile = async (id, token, format = 'blob') => {
    const res = await fetch(`${url}/files/${id}`, { 
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            throw new Error(data.message || 'Failed to fetch file preview');
        }
        throw new Error('Failed to fetch file preview');
    }

    if (format === 'text') {
        return await res.text();
    }
    
    return await res.blob();
}