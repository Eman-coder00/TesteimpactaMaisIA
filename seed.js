const { connectDB } = require('./db');
require('dotenv').config();

async function seed() {
    const { db, client } = await connectDB();
    console.log('Populando banco de dados...');

    // Limpar coleções (opcional - cuidado)
    // await db.collection('posts').deleteMany({});
    // await db.collection('events').deleteMany({});

    const posts = [
        {
            title: 'Educação para Todos',
            slug: 'educacao-para-todos',
            category: 'Educação',
            description: 'Levando conhecimento e recursos para comunidades carentes.',
            image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80',
            likes: [],
            impact: '500+ Alunos',
            volunteers: '15 Educadores',
            status: 'Ativo'
        },
        {
            title: 'Reflorestar Juntos',
            slug: 'reflorestar-juntos',
            category: 'Meio Ambiente',
            description: 'Projeto focado na recuperação de áreas degradadas locais.',
            image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80',
            likes: [],
            impact: '10k Árvores',
            volunteers: '50 Voluntários',
            status: 'Em progresso'
        },
        {
            title: 'Alimentando Esperança',
            slug: 'alimentando-esperanca',
            category: 'Social',
            description: 'Distribuição de refeições e apoio a famílias em situação de vulnerabilidade.',
            image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80',
            likes: [],
            impact: '200 Refeições/Dia',
            volunteers: '20 Cozinheiros',
            status: 'Crítico'
        }
    ];

    const events = [
        {
            title: 'Fórum de Sustentabilidade',
            category: 'Meio Ambiente',
            description: 'Debate sobre práticas sustentáveis no dia a dia.',
            longDescription: 'Participe do nosso fórum anual onde especialistas discutem como pequenas mudanças no cotidiano podem gerar grandes impactos ambientais. O evento contará com painéis de discussão e workshops práticos.',
            date: '2026-05-15',
            time: '19:00',
            location: 'Online (Zoom)',
            image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80'
        },
        {
            title: 'Mutirão EcoAção',
            category: 'Meio Ambiente',
            description: 'Limpeza e revitalização do Parque Central.',
            longDescription: 'Vamos nos reunir para uma manhã de ação! Traremos luvas e sacos, você traz sua energia. Juntos vamos limpar as trilhas e plantar mudas nativas no coração da nossa cidade.',
            date: '2026-05-22',
            time: '09:00',
            location: 'Parque Central - Portão A',
            image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80'
        },
        {
            title: 'Workshop: Inovação Social',
            category: 'Educação',
            description: 'Como usar a tecnologia para causas sociais.',
            longDescription: 'Um workshop imersivo para empreendedores sociais e entusiastas. Aprenda a utilizar ferramentas digitais modernas para escalar o impacto de projetos comunitários.',
            date: '2026-06-05',
            time: '14:00',
            location: 'Hub Impacta - Sala 4',
            image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80'
        }
    ];

    // Upsert posts (by slug)
    for (const post of posts) {
        await db.collection('posts').updateOne(
            { slug: post.slug },
            { $set: post },
            { upsert: true }
        );
    }

    // Upsert events (by title)
    for (const event of events) {
        await db.collection('events').updateOne(
            { title: event.title },
            { $set: event },
            { upsert: true }
        );
    }

    console.log('Seed finalizado com sucesso!');
    await client.close();
    process.exit(0);
}

seed().catch(err => {
    console.error('Erro no seed:', err);
    process.exit(1);
});
