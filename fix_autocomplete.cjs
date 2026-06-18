const fs = require('fs');

const files = fs.readdirSync('src/components').filter(f => f.endsWith('Modal.tsx'));
for (const file of files) {
  const filePath = `src/components/${file}`;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('const AutocompleteInput =')) {
    if (!content.includes('const [isTyping, setIsTyping]')) {
      content = content.replace(
        '  const [activeIndex, setActiveIndex] = useState(0);',
        '  const [activeIndex, setActiveIndex] = useState(0);\n  const [isTyping, setIsTyping] = useState(false);'
      );
      
      content = content.replace(
        '  const filteredOptions = useMemo(() => {\n    if (!value) return [];',
        '  const filteredOptions = useMemo(() => {\n    if (!isTyping) return [];\n    if (!value) return [];'
      );
      
      content = content.replace(
        'onChange={(e) => {\n          onChange(e.target.value);\n          setIsOpen(true);\n        }}',
        'onChange={(e) => {\n          onChange(e.target.value);\n          setIsTyping(true);\n          setIsOpen(true);\n        }}'
      );
      
      content = content.replace(
        'onClick={() => {\n                onChange(opt);\n                setIsOpen(false);\n              }}',
        'onClick={() => {\n                onChange(opt);\n                setIsTyping(false);\n                setIsOpen(false);\n              }}'
      );
      
      content = content.replace(
        'if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {\n        setIsOpen(false);\n      }',
        'if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {\n        setIsOpen(false);\n        setIsTyping(false);\n      }'
      );
      
      content = content.replace(
        'if (isOpen) {\n        if (filteredOptions.length > 0 && activeIndex >= 0 && activeIndex < filteredOptions.length) {\n          onChange(filteredOptions[activeIndex]);\n        }\n        setIsOpen(false);\n      }',
        'if (isOpen) {\n        if (filteredOptions.length > 0 && activeIndex >= 0 && activeIndex < filteredOptions.length) {\n          onChange(filteredOptions[activeIndex]);\n        }\n        setIsOpen(false);\n        setIsTyping(false);\n      }'
      );
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
}
