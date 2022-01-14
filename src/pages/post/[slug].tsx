import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {

  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  const bodyLength = RichText.asText(
    post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
  ).split(" ").length;

  const headingLength = post.data.content.reduce((acc, data) => {
    if (data.heading) {
      return [...acc, ...data.heading.split(" ")];
    }

    return [...acc];
  }, []).length

  const readingTime = Math.ceil(
    (headingLength + bodyLength) / 200
  )
  
  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>

      {post.data.banner.url && 
        <section className={styles.imageContainer}>
          <img src={post.data.banner.url} alt="Banner" />
        </section>
      }

      <main className={commonStyles.contentContainer}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={commonStyles.postInfo}>
            <time>
              <FiCalendar />
              {format(
                new Date(post.first_publication_date),
                'dd MMM yyyy',
                {
                  locale: ptBR,
                }
              )}
            </time>

            <span>
              <FiUser />
              {post.data.author}
            </span>

            <span>
              <FiClock /> {readingTime} min
            </span>
          </div>

            <div className={styles.postContent}>
              {post.data.content.map(({heading, body}) => (
                <div key={heading}>
                  {heading && <h2>{heading}</h2>}

                  <div
                    className={styles.textBody}
                    dangerouslySetInnerHTML={{__html: RichText.asHtml(body)}}
                  />
                </div>
              ))}
            </div>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    { pageSize: 3}
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },

  }

  return {
    props: {
      post
    }
  }
};
