'use client';

import { useState } from 'react';

export default function SignatureWall() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return; // 防止重复提交

    setIsSubmitting(true);
    setMessage(''); // 清空之前的消息
    
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
        form.reset();
      } else {
        setMessage(result.error || '提交失败');
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false); // 无论成功失败，都恢复按钮状态
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
            disabled={isSubmitting}
            className="w-full mb-4 p-2 border rounded text-black dark:text-black placeholder-gray-500 dark:placeholder-gray-600 disabled:bg-gray-100" 
            style={{color: 'black'}}
          />
          <textarea 
            name="signature" 
            placeholder="签名" 
            required 
            disabled={isSubmitting}
            className="w-full mb-4 p-2 border rounded text-black dark:text-black placeholder-gray-500 dark:placeholder-gray-600 resize-none disabled:bg-gray-100" 
            rows={3}
            style={{color: 'black'}}
          ></textarea>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full text-white py-2 rounded transition-colors ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-black dark:text-black" style={{color: 'black'}}>{message}</p>}
      </div>
    </div>
  );
}