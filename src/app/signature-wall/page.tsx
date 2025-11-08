'use client';

import { useState } from 'react';

export default function SignatureWall() {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // 保存表单引用
    const formData = new FormData(form);
    const data = {
      nickname: formData.get('nickname'),
      signature: formData.get('signature'),
    };

    try {
      const response = await fetch('/api/add-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        // 如果JSON解析失败，根据HTTP状态码判断
        if (response.ok) {
          setMessage('提交成功');
          form.reset();
          return;
        } else {
          setMessage('提交失败');
          return;
        }
      }
      
      if (response.ok) {
        setMessage(result.message || '提交成功');
      } else {
        setMessage(result.error || '提交失败');
      }
      form.reset();
    } catch (error) {
      console.error('Network error:', error);
      setMessage('网络错误，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4" style={{ backgroundImage: "url('/thanksgiving-bg.JPG')" }}>
      <div className="bg-white bg-opacity-90 p-8 rounded-lg max-w-md w-full transform -translate-y-25">
        <h2 className="text-2xl font-bold mb-4 text-center text-black dark:text-black">添加签名</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="nickname" 
            placeholder="昵称" 
            required 
            className="w-full mb-4 p-2 border rounded text-black dark:text-black placeholder-gray-500 dark:placeholder-gray-600" 
            style={{color: 'black'}}
          />
          <textarea 
            name="signature" 
            placeholder="签名" 
            required 
            className="w-full mb-4 p-2 border rounded text-black dark:text-black placeholder-gray-500 dark:placeholder-gray-600 resize-none" 
            rows={3}
            style={{color: 'black'}}
          ></textarea>
          <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600">提交</button>
        </form>
        {message && <p className="mt-4 text-center text-black dark:text-black" style={{color: 'black'}}>{message}</p>}
      </div>
    </div>
  );
}