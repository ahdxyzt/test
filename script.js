// 事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 初始化选择器和事件监听器
    const fineTuningMethodSelect = document.getElementById('fine-tuning-method');
    const loraParamsSection = document.getElementById('lora-params-section');
    const precisionSelect = document.getElementById('precision');
    const hardwareSelect = document.getElementById('hardware');
    const allHardwareOptions = 0;
   
   
   

// 计算按钮点击事件
document.getElementById('calculate-button').addEventListener('click', function() {
    // 获取用户输入的参数
    const modelType = document.getElementById('model-type').value;
    const precision = document.getElementById('precision').value;
    const concurrency = parseInt(document.getElementById('concurrency').value);

    const framework =0;
    const fineTuningMethod = 0;
    const loraTrainableParams =  0;
    const hardware = 0;
const contextLength=0;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<h2>推荐方案:</h2>';
    // 调用计算函数并显示结果
    const calculationResults = calculateRequirements(modelType, precision, concurrency, contextLength, framework, fineTuningMethod, loraTrainableParams, hardware);

    if (calculationResults) {
        let hardwareRecommendationHTML = '';
        if (calculationResults.hardware_recommendation && typeof calculationResults.hardware_recommendation === 'object') {
            hardwareRecommendationHTML += '<div class="result-item"><strong>推荐算力卡型号:</strong></div>';
            const hardwareName = Object.keys(calculationResults.hardware_recommendation)[0];
            const count = calculationResults.hardware_recommendation[hardwareName];
            hardwareRecommendationHTML += `<div class="result-item">  - 国产算力卡: <strong>${calculationResults.guochanka} </strong></div>`;
hardwareRecommendationHTML += `<div class="result-item">  - 英伟达卡: <strong>${calculationResults.navidaka} </strong></div>`;
            hardwareRecommendationHTML += '<div class="result-item"><strong>推荐设备型号:</strong></div>';
            hardwareRecommendationHTML += `<div class="result-item">  1. <strong>${calculationResults.deviceoncloud} </strong></div>`;
hardwareRecommendationHTML += `<div class="result-item">  2. <strong>${calculationResults.devicelocal} </strong></div>`;
        }


        resultsDiv.innerHTML += `
            <div class="result-item"><strong>推荐模型规模:</strong> ${getModelDisplayName(modelType)}</div>
         
            
            ${fineTuningMethod === 'lora' ? `<div class="result-item"><strong>LoRA 可训练参数:</strong> ${loraTrainableParams} Billion</div>` : ''}
            <hr>
            <div class="result-item"><strong>最低服务器配置需求:</strong></div>
            <div class="result-item">  - CPU: <strong>${calculationResults.model_weights_memory}</strong></div>
            <div class="result-item">  - 内存: <strong>${calculationResults.kv_cache_memory}</strong></div>
            <div class="result-item">  - 硬盘: <strong>${calculationResults.activation_memory}</strong></div>
            <div class="result-item">  - 显卡: <strong>${calculationResults.other_memory}</strong></div>
            
            ${hardwareRecommendationHTML}
            <div class="result-item"><strong>预估算力需求:</strong> ${calculationResults.compute}</div>
          
            <div class="result-item"><strong>部署建议:</strong> ${calculationResults.deployment_recommendation}</div>
            <div class="result-item"><strong>建议:</strong> ${calculationResults.recommendation}</div>
            <p class="result-item" style="font-size: smaller; color: gray;">* 显存和算力均为估算值，实际情况可能因多种因素而异。</p>
            <p class="result-item" style="font-size: smaller; color: gray;">* 推理显存估算公式：总内存 = 模型权重内存 + KV Cache 内存 + 激活内存 + 碎片化内存</p>
            ${fineTuningMethod === 'lora' ? `<p class="result-item" style="font-size: smaller; color: gray;">* LoRA 微调会增加少量模型权重内存。</p>` : ''}
            <p class="result-item" style="font-size: smaller; color: gray;">* 模型架构参数 (层数、隐藏维度等) 基于 DeepSeek 模型近似配置。</p>
            <p class="result-item" style="font-size: smaller; color: gray;">* 算力卡数量为满足显存需求的**最少估算**，实际部署可能需要更多卡以满足性能需求。</p>
            <p class="result-item" style="font-size: smaller; color: gray;">* 算力机台数假设 NVIDIA 和 华为昇腾 机器每台都包含 8 张算力卡。</p>
        `;
    } else {
        resultsDiv.innerHTML += '<p>无法估算，请检查输入参数。</p>';
    }
});


//计算资源需求
function calculateRequirements(modelType, precision, concurrency, contextLength, framework, fineTuningMethod = 'inference', loraTrainableParamsBillion = 0, hardware) {
    let estimatedMemoryGB = 0;
    let computeLoad = "中等";
    let recommendation = "请根据实际情况调整参数和框架选择。";
    let model_weights_memory_gb = 0;
    let kv_cache_memory_gb = 0;
    let activation_memory_gb = 0;
    let other_memory_gb = 0;
    let machine_count = 0;
    let deployment_recommendation = "";
    let guochanka=0;
    let navidaka=0;
    let deviceoncloud=0;
    let devicelocal=0;
    // **直接使用常量定义模型大小 (GB) - 来自用户提供的数据**
    const modelSizesGB = {
        'r1_671b': { cpu:"64核以上，服务器集群",mem:"512GB+",yinpan:"300GB+，模型文件约400-500GB",xianka:"多节点分布式训练，80GB+显存"},
      'r1_70b': { cpu:"32核以上，服务器级CPU",mem:"128GB+",yinpan:"70GB+，模型文件约43-45GB",xianka:"多卡并行，64GB+显存"},
'r1_32b': { cpu:"16核以上，如AMD Ryzen 9或Intel i9",mem:"64GB+",yinpan:"30GB+，模型文件约20-22GB",xianka:"24GB+显存"},
'r1_14b': { cpu:"12核以上",mem:"32GB+",yinpan:"15GB+，模型文件约9-10GB",xianka:"16GB+显存"},
'r1_7b': { cpu:"8核以上，推荐现代多核CPU",mem:"16GB+",yinpan:"8GB+，模型文件约4-5GB",xianka:"推荐8GB+显存"},
'r1_1.5b': { cpu:"最低4核，推荐Intel/AMD多核处理器",mem:"8GB+",yinpan:"3GB+存储空间，模型文件约1.5-2GB",xianka:"非必需，若GPU加速可选4GB+显存"}
    };
const hardwareRecommendation = {
        'r1_671b': { guochan:"Ascend 910B 64G，16卡",navida:"H100/H800/H20 80G，8卡"},
      'r1_70b': { guochan:"Ascend 910B 64G，8卡",navida:"H100/H800/H20 80G，8卡或A10，4卡"},
'r1_32b': { guochan:"Ascend 910B 64G，4卡",navida:"H100/H800/H20 80G，4卡或A10，2卡"},
'r1_14b': { guochan:"Atlas 300I Duo",navida:"A10"},
'r1_7b': { guochan:"Atlas 300I Duo",navida:"4090 24GB"},
'r1_1.5b': { guochan:"Atlas 300V",navida:"4090 24GB"}
    };
const hardwareRecommendation2 = {
        'r1_671b': { cloud:"云上GPU/裸金属",fuwuqi:"Atlas 800I A2，2台"},
      'r1_70b': { cloud:"云上GPU/裸金属",fuwuqi:"Atlas 800I A2"},
'r1_32b': { cloud:"云上GPU/裸金属",fuwuqi:"Atlas 800I A2"},
'r1_14b': { cloud:"云上GPU/裸金属",fuwuqi:"Atlas 300I Duo"},
'r1_7b': { cloud:"云上GPU/裸金属",fuwuqi:"Atlas 300I Duo"},
'r1_1.5b': { cloud:"云上GPU/裸金属",fuwuqi:"Atlas 300V"}
    };
    // **模型架构细节 (来自用户提供的数据)**
    const modelArchParams = {
        'r1_671b': { params: 671, layers: 61, hidden_dim: 7168, kv_heads: 128, head_dim: 128, kv_compress_dim: 512, moe: true },
        'r1_1.5b': { params: 1.5, layers: 28, hidden_dim: 2020, kv_heads: 3, head_dim: 673, kv_compress_dim: null, moe: false },
        'r1_7b':   { params: 7, layers: 34, hidden_dim: 4096, kv_heads: 32, head_dim: 128, kv_compress_dim: null, moe: false },
        'r1_8b':   { params: 8, layers: 32, hidden_dim: 4096, kv_heads: 32, head_dim: 128, kv_compress_dim: null, moe: false },
        'r1_14b':  { params: 14, layers: 69, hidden_dim: 4096, kv_heads: 32, head_dim: 128, kv_compress_dim: null, moe: false },
        'r1_32b':  { params: 32, layers: 64, hidden_dim: 6400, kv_heads: 8, head_dim: 800, kv_compress_dim: null, moe: false },
        'r1_70b':  { params: 70, layers: 80, hidden_dim: 8192, kv_heads: 64, head_dim: 128, kv_compress_dim: null, moe: false }
    };

    const model_config = modelArchParams[modelType];

    const n_dtype_bytes = {
        'fp8': 1,
        'fp16': 2,
        'bf16': 2,
        'int8': 1,
        'int4': 0.5
    };
    const dtype_bytes = n_dtype_bytes[precision];


    // const token_num = contextLength;


    // 1. 模型权重内存 (直接从常量读取)
    model_weights_memory_gb = modelSizesGB[modelType].cpu;


    // 2. KV Cache 内存 - 基于理论模型的计算
    let kvCacheSizeBytes = 0;
    if (model_config.moe) {
        // MoE 模型（R1 671B）- 使用压缩维度
        // kv_compress_dim是一个优化参数，使得KV缓存比标准Transformer更小
        // 增加可读性
        const bytes_per_token = 2 * model_config.kv_compress_dim * dtype_bytes; // 2表示K和V
        kvCacheSizeBytes = concurrency * contextLength * model_config.layers * bytes_per_token;
    } else { 
        // 标准 Transformer 模型 (蒸馏模型) - 使用标准公式
        // 每个注意力头的KV缓存大小 = 2(K和V) * 头维度 * 数据类型字节数
        const head_kv_bytes = 2 * model_config.head_dim * dtype_bytes;
        // 每层的KV缓存 = 头数 * 每个头的KV缓存
        const layer_kv_bytes = model_config.kv_heads * head_kv_bytes;
        // 总KV缓存 = 并发数 * 上下文长度 * 模型层数 * 每层KV缓存
        kvCacheSizeBytes = concurrency * contextLength * model_config.layers * layer_kv_bytes;
    }
    // GB
    kv_cache_memory_gb = modelSizesGB[modelType].mem;
    

    // 3. 激活内存 - 基于理论模型的计算
    // 激活内存与模型的复杂度和并发数成正比
    // 每个token的激活内存大小与hidden_dim相关
    const tokens_activation_bytes = model_config.hidden_dim * dtype_bytes;
    // 标准的激活内存估算 - 一个简化模型
    // 使用一个系数来表示平均每层每token的激活空间需求相对于hidden_dim的比例
    const activation_ratio = model_config.moe ? 0.05 : 0.1; // MoE模型激活内存相对较小
    // 总激活内存 = 并发数 * 上下文长度 * 模型层数 * 每token激活内存 * 系数
    const activationSizeBytes = concurrency * contextLength * model_config.layers * tokens_activation_bytes * activation_ratio;

    // GB
    activation_memory_gb = modelSizesGB[modelType].yinpan;


    // 4. 总内存和碎片化内存
    estimatedMemoryGB = 0;
    other_memory_gb = modelSizesGB[modelType].xianka; // 碎片化及其他开销 (20%)
    estimatedMemoryGB = other_memory_gb;
    guochanka=hardwareRecommendation[modelType].guochan;
    navidaka=hardwareRecommendation[modelType].navida;
    deviceoncloud=hardwareRecommendation2[modelType].cloud;
    devicelocal=hardwareRecommendation2[modelType].fuwuqi;
    const hardwareMemoryGB = {
        'nvidia_a10': 24,
        'nvidia_a100_80g': 80,
        'nvidia_a100_40g': 40,
        'nvidia_a800': 80,
        'nvidia_h20': 96,
        'nvidia_h800': 80,
        'nvidia_l40s': 48,
        'nvidia_rtx4090': 24,
        'ascend910b': 64,
        'Atlas300IPro': 24,
        'Atlas300IDuo_48': 48,
        'Atlas300IDuo_96': 96
    };

   

    const cardsPerMachine = 8;
    if (hardwareRecommendation && hardwareRecommendation[hardware]) {
        machine_count = Math.ceil(hardwareRecommendation[hardware] / cardsPerMachine);
    } else {
        machine_count = 0;
    }


    let deploymentFactorCompute = 1;
    if (model_config.params >= 70) { // 70B 及以上模型
        deployment_recommendation += " 建议采用多机多卡或模型并行等分布式部署策略。";
        computeLoad = adjustComputeLoad(computeLoad, 1.5);
    } else if (model_config.params >= 7) { // 7B-70B 模型
        deployment_recommendation += " 建议采用多卡并行或张量并行等方式以提高吞吐量。";
        computeLoad = adjustComputeLoad(computeLoad, 1.2);
    } else { // 小型模型 (7B 以下)
        deployment_recommendation += " 可以尝试单卡部署，或使用多卡并行以支持更高并发。";
    }


    let hardwareComputeFactor = 1;
    switch (hardware) {
        case 'ascend910b': hardwareComputeFactor = 0.8; computeLoad = adjustComputeLoad(computeLoad, 0.8); recommendation += " 昇腾910b 性能可能略低于同级别N卡。"; break;
        case 'Atlas300IPro': hardwareComputeFactor = 0.3; computeLoad = adjustComputeLoad(computeLoad, 0.6); recommendation += " Atlas300IPro 性能相对很低，适合小型模型。"; break;
        case 'Atlas300IDuo_48': hardwareComputeFactor = 0.6; computeLoad = adjustComputeLoad(computeLoad, 0.6); recommendation += " Atlas300IDuo-48GB性能相对较低，适合中小型模型。"; break;
        case 'Atlas300IDuo_96': hardwareComputeFactor = 0.6; computeLoad = adjustComputeLoad(computeLoad, 0.6); recommendation += " Atlas300IDuo-96GB性能相对较低，适合中小型模型。"; break;
        case 'nvidia_a10': hardwareComputeFactor = 0.6; computeLoad = adjustComputeLoad(computeLoad, 0.6); recommendation += " A10 性能相对较低，适合中小型模型。"; break;
        case 'nvidia_a100_80g': hardwareComputeFactor = 1.2; computeLoad = adjustComputeLoad(computeLoad, 1.2); break;
        case 'nvidia_a100_40g': hardwareComputeFactor = 1.1; computeLoad = adjustComputeLoad(computeLoad, 1.1); recommendation += " A100-40G 性能略低于 A100-80G。"; break;
        case 'nvidia_a800': hardwareComputeFactor = 1.1; computeLoad = adjustComputeLoad(computeLoad, 1.1); break;
        case 'nvidia_h20': hardwareComputeFactor = 1.3; computeLoad = adjustComputeLoad(computeLoad, 1.3); break;
        case 'nvidia_h800': hardwareComputeFactor = 1.5; computeLoad = adjustComputeLoad(computeLoad, 1.5); computeLoad = "非常高"; recommendation = " H800/H20 是高性能卡，适合大型模型。"; break;
        case 'nvidia_rtx4090': hardwareComputeFactor = 0.9; computeLoad = adjustComputeLoad(computeLoad, 0.9); recommendation += " RTX 4090 消费级卡，性价比高，但显存可能受限。"; break;
        case 'nvidia_l40s': hardwareComputeFactor = 1.0; computeLoad = adjustComputeLoad(computeLoad, 1.0); break;
    }
    computeLoad = adjustComputeLoad(computeLoad, hardwareComputeFactor);


    if (framework === 'vllm') {
        computeLoad = adjustComputeLoad(computeLoad, 1.1);
        recommendation += " vLLM 框架通常能提供更高的推理吞吐量。";
        deployment_recommendation += " 推荐使用 vLLM 框架进行高性能推理部署。";
    } else if (framework === 'llama_cpp') {
        computeLoad = adjustComputeLoad(computeLoad, 0.9);
        recommendation += " llama.cpp 框架适用于 CPU/GPU 混合推理场景。";
        deployment_recommendation += " llama.cpp 适用于 CPU/GPU 混合推理，如果资源有限或需要CPU参与推理，可以考虑。";
    } else if (framework === 'mindspore') {
        recommendation += " MindSpore 是华为昇腾平台的推荐框架，性能可能更优。";
        deployment_recommendation += " 对于华为昇腾 910B 平台，强烈推荐使用 MindSpore 框架以获得最佳性能。";
    } else {
        deployment_recommendation += " 通用部署建议：根据模型大小和并发需求，选择合适的推理框架。";
    }


    return {
        memory: estimatedMemoryGB+ " GB (估算值)",
        model_weights_memory: model_weights_memory_gb,
        kv_cache_memory: kv_cache_memory_gb,
        activation_memory: activation_memory_gb,
        other_memory: other_memory_gb,
        compute: computeLoad + " (估算值)",
        recommendation: recommendation,
        hardware_recommendation: hardwareRecommendation,
        machine_count: machine_count,
        deployment_recommendation: deployment_recommendation,
        guochanka:guochanka,
        navidaka:navidaka,
        deviceoncloud:deviceoncloud,
        devicelocal:devicelocal
    };
}


function calculateHardwareCount(estimatedMemoryGB, hardwareMemoryGB, selectedHardware) {
    const cardCounts = {};

    if (hardwareMemoryGB.hasOwnProperty(selectedHardware)) {
        const cardMemory = hardwareMemoryGB[selectedHardware];
        const numCards = Math.ceil(estimatedMemoryGB / cardMemory);
        if (numCards > 0) {
            cardCounts[selectedHardware] = numCards;
        }
    } else {
        console.warn(`Selected hardware type "${selectedHardware}" not found in hardwareMemoryGB.`);
        return {};
    }
    return cardCounts;
}


function adjustComputeLoad(currentLoad, factor) {
    const loadLevels = ["低", "中等", "较高", "高", "非常高"];
    let currentIndex = loadLevels.indexOf(currentLoad);
    if (currentIndex === -1) currentIndex = 1;

    let newIndex = Math.round(currentIndex * factor);
    newIndex = Math.max(0, Math.min(loadLevels.length - 1, newIndex));
    return loadLevels[newIndex];
}


function getModelDisplayName(modelType) {
    const modelDisplayNames = {
        'r1_671b': 'DeepSeek R1/V3 671B',
        'r1_1.5b': 'DeepSeek R1 1.5B (蒸馏)',
        'r1_7b': 'DeepSeek R1 7B (蒸馏)',
        'r1_8b': 'DeepSeek R1 8B (蒸馏)',
        'r1_14b': 'DeepSeek R1 14B (蒸馏)',
        'r1_32b': 'DeepSeek R1 32B (蒸馏)',
        'r1_70b': 'DeepSeek R1 70B (蒸馏)'
    };
    return modelDisplayNames[modelType] || modelType;
}


function getDeploymentDisplayName(deploymentMethod) {
    // 部署方式显示名称 (虽然不再使用选择，但函数保留，可能在部署建议中使用)
    const deploymentDisplayNames = {
        'single_card': '单卡部署',
        'multi_card': '多卡部署',
        'multi_machine_multi_card': '多机多卡部署',
        'tensor_parallel': '张量并行',
        'pipeline_parallel': '流水线并行',
        'model_parallel': '模型并行 (通用)'
    };
    return deploymentDisplayNames[deploymentMethod] || deploymentMethod;
}


function getHardwareDisplayName(hardware) {
    const hardwareDisplayNames = {
        'nvidia_h20': 'NVIDIA H20',
        'nvidia_h800': 'NVIDIA H800',
        'nvidia_a800': 'NVIDIA A800',
        'nvidia_l40s': 'NVIDIA L40S',
        'nvidia_a10': 'NVIDIA A10',
        'nvidia_rtx4090': 'NVIDIA RTX 4090',
        'nvidia_a100_80g': 'NVIDIA A100-80G',
        'nvidia_a100_40g': 'NVIDIA A100-40G',
        'ascend910b': '华为昇腾910B',
        'Atlas300IPro': '华为昇腾300IPro',
        'Atlas300IDuo_48': '华为昇腾300IDuo 48G',
        'Atlas300IDuo_96': '华为昇腾300IDuo 96G'
    };
    return hardwareDisplayNames[hardware] || hardware;
}


function getFrameworkDisplayName(framework) {
    const frameworkDisplayNames = {
        'auto': '自动/通用',
        'vllm': 'vLLM',
        'llama_cpp': 'llama.cpp',
        'mindspore': 'MindSpore'
    };
    return frameworkDisplayNames[framework] || framework;
}


function getFineTuningMethodDisplayName(fineTuningMethod) {
    const fineTuningMethodDisplayNames = {
        'inference': '推理',
        'lora': 'LoRA 微调'
    };
    return fineTuningMethodDisplayNames[fineTuningMethod] || fineTuningMethod;
}

function getPrecisionDisplayName(precision) {
    const precisionDisplayNames = {
        'fp8': 'FP8',
        'fp16': 'FP16',
        'bf16': 'BF16',
        'int8': 'INT8',
        'int4': 'INT4'
    };
    return precisionDisplayNames[precision] || precision;
}});

