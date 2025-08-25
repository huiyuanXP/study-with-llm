(function(){
  function escapeHtml(s){
    return (s||"").replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  }

  // 支持：# 标题、列表、引用、粗体/斜体、代码块/行内代码、链接、段落
  window.markdownToHtml = function(src){
    let text = String(src || '').replace(/\r\n/g, '\n');

    // 代码块（先处理成占位）
    const fences = [];
    text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
      fences.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
      return `\u0000CODEBLOCK${fences.length-1}\u0000`;
    });

    // 行内代码
    text = text.replace(/`([^`]+?)`/g, (_, code)=> `<code>${escapeHtml(code)}</code>`);

    // 标题
    text = text
      .replace(/^###### (.*)$/gm, '<h6>$1</h6>')
      .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
      .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>');

    // 引用
    text = text.replace(/^\> (.*)$/gm, '<blockquote>$1</blockquote>');

    // 粗体 / 斜体（简单版）
    text = text
      .replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>')
      .replace(/\*([^*]+?)\*/g, '<i>$1</i>');

    // 链接
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // 列表
    text = text.replace(/^(?:\s*)\- (.*)$/gm, '<li>$1</li>');
    text = text.replace(/^(?:\s*)(\d+)\. (.*)$/gm, '<li>$2</li>');
    text = text.replace(/(?:<li>.*<\/li>\n?)+/g, m => m.includes('<li>1</li>') ? `<ol>${m}</ol>` : `<ul>${m}</ul>`);

    // 段落：对非标签行包裹 <p>
    text = text.split('\n').map(line=>{
      if(!line.trim()) return '';
      if(/^<(h\d|ul|ol|li|pre|blockquote|p|\/|code)/.test(line)) return line;
      return `<p>${line}</p>`;
    }).join('\n');

    // 还原代码块
    text = text.replace(/\u0000CODEBLOCK(\d+)\u0000/g, (_, i)=> fences[Number(i)]);

    return `<div class="md">${text}</div>`;
  };
})();
