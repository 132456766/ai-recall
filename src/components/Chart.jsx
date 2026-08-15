// ECharts 通用封装（数据看板 G 使用；依赖 ECharts / D3.js per 开发规划）
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function Chart({ option, height = 280, className }) {
  const ref = useRef(null);
  const inst = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    inst.current = echarts.init(ref.current, null, { renderer: 'canvas' });
    const onResize = () => inst.current && inst.current.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      inst.current && inst.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (inst.current && option) inst.current.setOption(option, true);
  }, [option]);

  return <div ref={ref} className={className} style={{ width: '100%', height }} />;
}
