#!/usr/bin/env python3
"""
Generate sample .pkl files for XAI model weights
Run this script to create the required pickle files
"""

import pickle
import numpy as np
import os

def generate_sample_weights():
    """Generate synthetic XAI model weight files"""
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Layer 1: Input feature extraction weights
    layer1_weights = {
        'weight_matrix': np.random.randn(256, 512).astype(np.float32),
        'bias': np.random.randn(512).astype(np.float32),
        'activation': 'relu',
        'layer_name': 'xai_feature_extractor',
        'metadata': {
            'trained_on': '2024-GST-Compliance-Dataset',
            'accuracy': 0.947,
            'loss': 0.023
        }
    }
    
    with open(os.path.join(script_dir, 'xai_weights_layer1.pkl'), 'wb') as f:
        pickle.dump(layer1_weights, f)
    print("[✓] Generated xai_weights_layer1.pkl")
    
    # Layer 2: Attention mechanism weights
    layer2_weights = {
        'attention_weights': np.random.randn(512, 768).astype(np.float32),
        'query_weights': np.random.randn(768, 64).astype(np.float32),
        'key_weights': np.random.randn(768, 64).astype(np.float32),
        'value_weights': np.random.randn(768, 64).astype(np.float32),
        'attention_type': 'multi_head',
        'num_heads': 8,
        'metadata': {
            'context_window': 2048,
            'dropout': 0.1
        }
    }
    
    with open(os.path.join(script_dir, 'xai_weights_layer2.pkl'), 'wb') as f:
        pickle.dump(layer2_weights, f)
    print("[✓] Generated xai_weights_layer2.pkl")
    
    # Layer 3: Explanation generator weights
    layer3_weights = {
        'explanation_matrix': np.random.randn(768, 1024).astype(np.float32),
        'confidence_weights': np.random.randn(1024, 1).astype(np.float32),
        'rule_embeddings': {
            f'GST_Rule_{i}': np.random.randn(768).astype(np.float32) 
            for i in range(100)
        },
        'severity_classifier': np.random.randn(1024, 3).astype(np.float32),
        'metadata': {
            'xai_version': '3.7.2',
            'interpretability_score': 0.89,
            'rule_coverage': 0.95
        }
    }
    
    with open(os.path.join(script_dir, 'xai_weights_layer3.pkl'), 'wb') as f:
        pickle.dump(layer3_weights, f)
    print("[✓] Generated xai_weights_layer3.pkl")
    
    print("\n[SUCCESS] All XAI weight files generated successfully!")
    print(f"[INFO] Files saved to: {script_dir}")

if __name__ == '__main__':
    generate_sample_weights()
